const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const { db } = require("./db");

class GooglePlayService {
    constructor() {
        this.packageName = process.env.PACKAGE_NAME;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            const [rows] = await db.query('SELECT firebase_json FROM site_settings WHERE id = ?', [1]);

            if (!rows || rows.length === 0) throw new Error("No Firebase credentials found");

            const jsonStr = rows[0].firebase_json;

            const credentials = JSON.parse(jsonStr);
            
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/androidpublisher']
            });
        } catch (error) {
            console.error('Failed to initialize Google Play auth:', error.message);
        }
    }

    async verifyPurchase(productId, purchaseToken) {
        try {
            if (!this.auth) {
                await this.initializeAuth();
            }

            const androidPublisher = google.androidpublisher({
                version: 'v3',
                auth: this.auth
            });

            const response = await androidPublisher.purchases.products.get({
                packageName: this.packageName,
                productId: productId,
                token: purchaseToken
            });

            return {
                isValid: response.data.purchaseState === 0,
                purchaseData: response.data
            };
        } catch (error) {
            console.error('Google Play verification error:', error.message);
            throw error;
        }
    }

    async verifySubscription(subscriptionId, purchaseToken) {
        try {
            if (!this.auth) {
                await this.initializeAuth();
            }

            const androidPublisher = google.androidpublisher({
                version: 'v3',
                auth: this.auth
            });

            const response = await androidPublisher.purchases.subscriptions.get({
                packageName: this.packageName,
                subscriptionId: subscriptionId,
                token: purchaseToken
            });

            return {
                isValid: !response.data.cancelReason,
                subscriptionData: response.data
            };
        } catch (error) {
            console.error('Google Play subscription verification error:', error.message);
            throw error;
        }
    }

    async consumePurchase(productId, purchaseToken) {
        try {
            if (!this.auth) {
                await this.initializeAuth();
            }

            const androidPublisher = google.androidpublisher({
                version: 'v3',
                auth: this.auth
            });

            await androidPublisher.purchases.products.consume({
                packageName: this.packageName,
                productId: productId,
                token: purchaseToken
            });

            return { success: true };
        } catch (error) {
            console.error('Google Play consume error:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new GooglePlayService();
