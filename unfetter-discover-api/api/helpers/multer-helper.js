const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
    storage
});

module.exports = {
    upload,
    attachmentArray: upload.array('attachments'),
    singleAttachment: upload.single('attachment')
};
