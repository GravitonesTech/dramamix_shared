const googlePlayService = {
  verifyPurchase: jest.fn(),
  verifySubscription: jest.fn(),
  consumePurchase: jest.fn().mockResolvedValue({ success: true }),
  initializeAuth: jest.fn().mockResolvedValue(undefined),
  auth: {},
  packageName: 'com.test.dramamix',
};

module.exports = googlePlayService;
