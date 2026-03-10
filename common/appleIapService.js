const axios = require('axios');

const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

const APPLE_STATUS = {
  VALID: 0,
  SANDBOX_RECEIPT_SENT_TO_PRODUCTION: 21007,
  PRODUCTION_RECEIPT_SENT_TO_SANDBOX: 21008,
};

class AppleIapService {
  constructor() {
    this.sharedSecret = process.env.APPLE_IAP_SHARED_SECRET || '';
    this.environment = process.env.APPLE_IAP_ENVIRONMENT || 'production';
  }

  async verifyReceipt(receiptData, productId) {
    const primaryUrl = this.environment === 'sandbox' ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL;
    const fallbackUrl = this.environment === 'sandbox' ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL;

    try {
      let result = await this._callApple(primaryUrl, receiptData);

      if (result.status === APPLE_STATUS.SANDBOX_RECEIPT_SENT_TO_PRODUCTION) {
        console.log('[AppleIAP] Sandbox receipt received in production — retrying with sandbox URL');
        result = await this._callApple(APPLE_SANDBOX_URL, receiptData);
      }

      if (result.status === APPLE_STATUS.PRODUCTION_RECEIPT_SENT_TO_SANDBOX) {
        console.log('[AppleIAP] Production receipt received in sandbox — retrying with production URL');
        result = await this._callApple(APPLE_PRODUCTION_URL, receiptData);
      }

      if (result.status !== APPLE_STATUS.VALID) {
        console.error('[AppleIAP] Verification failed — Apple status:', result.status);
        return {
          success: false,
          appleStatus: result.status,
          error: this._describeStatus(result.status),
          data: null,
        };
      }

      const latestReceiptInfo = result.latest_receipt_info || result.receipt?.in_app || [];
      const matchingPurchase = productId
        ? latestReceiptInfo.find((item) => item.product_id === productId)
        : latestReceiptInfo[latestReceiptInfo.length - 1];

      if (!matchingPurchase && productId) {
        return {
          success: false,
          appleStatus: result.status,
          error: 'Product ID not found in receipt',
          data: null,
        };
      }

      const purchase = matchingPurchase || latestReceiptInfo[0] || {};
      const expiresDateMs = purchase.expires_date_ms ? parseInt(purchase.expires_date_ms, 10) : null;
      const isActive = expiresDateMs ? expiresDateMs > Date.now() : true;

      return {
        success: true,
        appleStatus: result.status,
        error: null,
        data: {
          productId: purchase.product_id,
          transactionId: purchase.transaction_id,
          originalTransactionId: purchase.original_transaction_id,
          purchaseDateMs: purchase.purchase_date_ms ? parseInt(purchase.purchase_date_ms, 10) : null,
          expiresDateMs,
          isSubscriptionActive: isActive,
          isTrialPeriod: purchase.is_trial_period === 'true',
          cancellationDateMs: purchase.cancellation_date_ms
            ? parseInt(purchase.cancellation_date_ms, 10)
            : null,
          raw: purchase,
        },
      };
    } catch (err) {
      console.error('[AppleIAP] Network or unexpected error:', err.message);
      return {
        success: false,
        appleStatus: null,
        error: err.message,
        data: null,
      };
    }
  }

  async _callApple(url, receiptData) {
    const payload = {
      'receipt-data': receiptData,
      'exclude-old-transactions': true,
    };
    if (this.sharedSecret) {
      payload.password = this.sharedSecret;
    }

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    return response.data;
  }

  _describeStatus(status) {
    const descriptions = {
      21000: 'App Store could not read the JSON object you provided',
      21002: 'The data in the receipt-data property was malformed or missing',
      21003: 'The receipt could not be authenticated',
      21004: 'The shared secret you provided does not match the shared secret on file',
      21005: 'The receipt server is not currently available',
      21006: 'This receipt is valid but the subscription has expired',
      21007: 'This receipt is from the sandbox environment',
      21008: 'This receipt is from the production environment',
      21010: 'This receipt could not be authorized',
    };
    return descriptions[status] || `Unknown Apple status code: ${status}`;
  }
}

module.exports = new AppleIapService();
