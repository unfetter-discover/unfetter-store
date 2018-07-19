const mongoose = require('mongoose');

// Built out model if metadata is added later on
/**
 * {
 *     "_id": < ObjectId > ,
 *     "length": < num > ,
 *     "chunkSize": < num > ,
 *     "uploadDate": < timestamp > ,
 *     "md5": < hash > ,
 *     "filename": < string > ,
 *     "contentType": < string > ,
 *     "aliases": < string array > ,
 *     "metadata": < any > ,
 * }
 */
const attachmentsModel = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('attachments', attachmentsModel, 'attachments.files');
