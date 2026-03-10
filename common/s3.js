const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

function getCdnUrl(s3Key) {
  let cdnBase = process.env.CLOUDFLARE_CDN_URL || "";
  if (cdnBase.endsWith("/")) cdnBase = cdnBase.slice(0, -1);
  return `${cdnBase}/${s3Key}`;
}

function getS3KeyFromUrl(url) {
  const cdnBase = (process.env.CLOUDFLARE_CDN_URL || "").replace(/\/+$/, "");
  if (cdnBase && url.startsWith(cdnBase)) {
    return url.replace(cdnBase + "/", "");
  }
  const baseUrl = (process.env.BASE_URL || "").replace(/\/+$/, "");
  if (baseUrl && url.startsWith(baseUrl)) {
    return url.replace(baseUrl + "/", "");
  }
  return url;
}

async function uploadToS3(fileBuffer, s3Key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
  return getCdnUrl(s3Key);
}

async function deleteFromS3(fileUrl) {
  if (!fileUrl) return;
  try {
    const key = getS3KeyFromUrl(fileUrl);
    if (!key) return;
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  } catch (err) {
    console.error("Failed to delete from S3:", err.message);
  }
}

function generateS3Key(uploadPath, originalname) {
  const ext = path.extname(originalname);
  const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
  let prefix = uploadPath.replace(/^\/+|\/+$/g, "");
  return `${prefix}/${uniqueName}`;
}

module.exports = {
  s3Client,
  uploadToS3,
  deleteFromS3,
  getCdnUrl,
  getS3KeyFromUrl,
  generateS3Key,
  BUCKET,
};
