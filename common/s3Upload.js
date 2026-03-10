const multer = require("multer");
const { uploadToS3, generateS3Key, getCdnUrl } = require("./s3");

const memoryStorage = multer.memoryStorage();

function createUpload(options = {}) {
  return multer({
    storage: memoryStorage,
    fileFilter: options.fileFilter || undefined,
    limits: options.limits || { fileSize: 100 * 1024 * 1024 },
  });
}

async function uploadFileToS3(file, uploadPath) {
  const s3Key = generateS3Key(uploadPath, file.originalname);
  const cdnUrl = await uploadToS3(file.buffer, s3Key, file.mimetype);
  file.s3Key = s3Key;
  file.cdnUrl = cdnUrl;
  return cdnUrl;
}

function s3UploadMiddleware(uploadPaths) {
  return async (req, res, next) => {
    try {
      if (req.file) {
        const uploadPath = typeof uploadPaths === "string" ? uploadPaths : uploadPaths.default || "uploads";
        await uploadFileToS3(req.file, uploadPath);
      }

      if (req.files) {
        if (Array.isArray(req.files)) {
          const uploadPath = typeof uploadPaths === "string" ? uploadPaths : uploadPaths.default || "uploads";
          for (const file of req.files) {
            await uploadFileToS3(file, uploadPath);
          }
        } else {
          for (const [fieldname, files] of Object.entries(req.files)) {
            const uploadPath = (typeof uploadPaths === "object" && uploadPaths[fieldname]) || (typeof uploadPaths === "string" ? uploadPaths : uploadPaths.default || "uploads");
            for (const file of files) {
              await uploadFileToS3(file, uploadPath);
            }
          }
        }
      }

      next();
    } catch (err) {
      console.error("S3 upload error:", err);
      next(err);
    }
  };
}

module.exports = {
  createUpload,
  uploadFileToS3,
  s3UploadMiddleware,
};
