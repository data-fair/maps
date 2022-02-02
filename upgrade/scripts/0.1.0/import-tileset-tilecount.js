exports.description = 'Set tilecount field of old import'

exports.exec = async (db, debug) => {
  await db.collection('import-tilesets').updateMany({ status: 'done' }, [{ $set: { tileCount: '$tileImported' } }])
}
