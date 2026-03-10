const signedUrlService = {
  getSignedVideoUrl: jest.fn().mockResolvedValue({
    signedUrl: 'https://cdn.dramamix.com/videos/ep1.m3u8?token=mock&expires=9999999999',
    method: 's3-presigned',
    expiresAt: new Date(Date.now() + 1800 * 1000),
  }),
  isOwnedUrl: jest.fn().mockReturnValue(true),
  signCloudflareUrl: jest.fn().mockReturnValue('https://cdn.dramamix.com/videos/ep1.m3u8?token=mock&expires=9999999999'),
};

module.exports = signedUrlService;
