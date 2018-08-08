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
const attachmentsFilesModel = new mongoose.Schema({}, { strict: false });
const attachmentsChunksModel = new mongoose.Schema({}, { strict: false });

module.exports = {
    files: mongoose.model('attachmentfiles', attachmentsFilesModel, 'attachments.files'),
    chunks: mongoose.model('attachmentchunks', attachmentsChunksModel, 'attachments.chunks')
};
