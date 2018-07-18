const multer = require('multer');

class GridFSStorageEngine {
    _handleFile(req, file, cb) {
        if (global.unfetter.gridFSBucket) {
            const creator = req.user && req.user._id ? req.user._id : null;
            file.stream
                .pipe(
                    global.unfetter.gridFSBucket.openUploadStream(file.originalname, {
                        contentType: file.mimetype,
                        metadata: {
                            creator
                        }
                    })
                )
                .on('err', cb)
                .on('finish', created => {
                    cb(null, created);
                });
        } else {
            cb(new Error('GridFS Bucket Does not exists'));
        }
    }

    // Required by multer, but not used currently
    _removeFile(req, file, cb) { }
}

const storage = new GridFSStorageEngine();
const upload = multer({
    storage
});

module.exports = {
    upload,
    attachmentArray: upload.array('attachments'),
    singleAttachment: upload.single('attachment')
};
