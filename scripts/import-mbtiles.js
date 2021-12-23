const { Command, Option } = require('commander')
const { importMBTiles, createTilesetFromMBTiles } = require('../server/utils/import-mbtiles')
const fs = require('fs/promises')
const { nanoid } = require('nanoid')

const program = new Command()
program.version(require('../package').version)

program
  .addOption(new Option('--create', 'create the tileset if it does not exist'))
  .addOption(new Option('--insert-method <method>', 'set the insertion method').choices(['replace', 'merge']))
  .addOption(new Option('--tileset <id>', 'specify the tileset id'))
  .addOption(new Option('-f, --file <file>', 'path to the mbtiles file').makeOptionMandatory(true))
  .addOption(new Option('--area <area>', 'area used for merge operations'))
  // .addOption(new Option('--name <name>', ''))
  // .addOption(new Option('--description <description>', ''))
  .action(async(options) => {
    try {
      process.stdout.write('Connecting to mongodb ... ')
      const db = await require('../server/mongodb').start()
      console.log('ok')
      let tileset = options.tileset ? await db.collection('tilesets').findOne({ _id: options.tileset }) : undefined
      try {
        console.log('Validating Options :', options)
        if (tileset) {
          if (!options['insert-method']) throw new Error('the given tileset exist but no insertion methods has been specified')
          // merge/replace
        } else {
          options['insert-method'] = 'replace'
          if (!options.create) {
            if (options.tileset) throw new Error('the given tileset does not exist, use "--create" to create it from the given mbtiles')
            else throw new Error('no tileset has been specified, use "--create" to create a new tileset or/and "--tileset <tileset>" to specify a tileset id')
          }
        }
        console.log('Validating Options ... ok')
      } catch (error) {
        console.error(error.message)
        process.exit(-1)
      }
      if (!tileset) {
        process.stdout.write('Creating tileset ... ')
        tileset = await createTilesetFromMBTiles({ db }, { tileset: options.tileset, filename: options.file })
        console.log('ok')
      }
      const file = `./mbtiles/${nanoid()}.mbtiles`
      await fs.cp(options.file, file)
      options.file = file
      process.stdout.write('Create import task ... ')
      await importMBTiles({ db }, {
        tileset: tileset._id,
        filename: options.file,
        options: {
          area: options.area,
          method: options['insert-method'],
        },
      })
      console.log('ok')
      await require('../server/mongodb').stop()
      process.exit()
    } catch (error) {
      console.error(error)
      process.exit(-1)
    }
  }).parseAsync()
