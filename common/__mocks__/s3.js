const getCdnUrl = jest.fn((key) => `https://cdn.example.com/${key}`);
const generateS3Key = jest.fn((prefix, filename) => `${prefix}/${filename}`);
const uploadToS3 = jest.fn().mockResolvedValue({ Location: 'https://s3.example.com/file.mp4' });
const getSignedUrl = jest.fn().mockResolvedValue('https://s3.example.com/signed?token=abc');
const deleteFromS3 = jest.fn().mockResolvedValue(true);

module.exports = { getCdnUrl, generateS3Key, uploadToS3, getSignedUrl, deleteFromS3 };
