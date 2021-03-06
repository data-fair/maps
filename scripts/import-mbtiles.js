const { Command, Option } = require('commander')
const { importMBTiles, createTilesetFromMBTiles } = require('../server/utils/import-mbtiles')

const program = new Command()
program.version(require('../package').version)

program
  .addOption(new Option('--create', 'create the tileset if it does not exist'))
  .addOption(new Option('--insert-method <method>', 'set the insertion method').choices(['replace', 'merge']))
  .addOption(new Option('--tileset <id>', 'specify the tileset id'))
  .addOption(new Option('-f, --file <file>', 'path to the mbtiles file').makeOptionMandatory(true))
  .addOption(new Option('--area <area>', 'area used for merge operations'))
  .addOption(new Option('--exclude-prop <property...>', 'exclude a property from all features in the tileset'))
  .addOption(new Option('--exclude-layer <layer...>', 'exclude a layer'))
  // .addOption(new Option('--name <name>', ''))
  // .addOption(new Option('--description <description>', ''))
  .action(async(options) => {
    try {
      console.log('Connecting to mongodb ... ')
      const db = await require('../server/mongodb').start()
      console.log('ok')
      let tileset = options.tileset ? await db.collection('tilesets').findOne({ _id: options.tileset }) : undefined
      try {
        console.log('Validating Options :', options)
        if (tileset) {
          if (!options.insertMethod) throw new Error('the given tileset exist but no insertion methods has been specified')
          // merge/replace
        } else {
          options.insertMethod = 'create'
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

      const excludeProps = options.excludeProp || []
      const excludeLayers = options.excludeLayer || []

      if (!tileset) {
        console.log('Creating tileset ... ')
        tileset = await createTilesetFromMBTiles(
          { db },
          { _id: options.tileset, filename: options.file },
          { excludeProps, excludeLayers },
        )
        console.log('ok')
      }

      const task = {
        tileset: tileset._id,
        filename: options.file,
        options: {
          insertMethod: options.insertMethod || 'replace',
          excludeProps,
          excludeLayers,
        },
      }
      if (options.area) task.options.area = options.area

      console.log('Create import task ... ')
      await importMBTiles({ db }, task)
      console.log('ok', task)
      await require('../server/mongodb').stop()
      process.exit()
    } catch (error) {
      console.error(error)
      process.exit(-1)
    }
  }).parseAsync()
