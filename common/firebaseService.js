const admin = require('firebase-admin');
const crypto = require('crypto');
const { db } = require("./db");

let firebaseApp = null;
let currentHash = null;

async function initializeFirebaseFromDB() {
    const [rows] = await db.query('SELECT firebase_json FROM site_settings WHERE id = ?', [1]);

    if (!rows || rows.length === 0) throw new Error("No Firebase credentials found");

    const jsonStr = rows[0].firebase_json;
    const newHash = crypto.createHash('sha256').update(jsonStr).digest('hex');

    if (firebaseApp && newHash === currentHash) {
        return firebaseApp;
    }

    const serviceAccountJson = JSON.parse(jsonStr);

    if (firebaseApp) {
        await firebaseApp.delete();
    }

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
    }, 'dynamic-' + Date.now());

    currentHash = newHash;
    return firebaseApp;
}

async function sendPushNotification({ notificationData, tokens = [], topic = null }) {
    try {
        const app = await initializeFirebaseFromDB();
        const messaging = app.messaging();

        const message = {
            notification: {
                title: notificationData.title,
                body: notificationData.body,
            },
        };

        if (notificationData.image) {
            message.notification.image = notificationData.image;
        }

        if (topic) {
            message.topic = topic;
            const response = await messaging.send(message);
            return { success: true, response };
        }

        if (tokens.length === 0) {
            const [users] = await db.query('SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL AND fcm_token != "" AND is_notification_on = 1 AND is_deleted = 0');
            tokens = users.map(u => u.fcm_token).filter(Boolean);
        }

        if (tokens.length === 0) {
            return { success: false, message: 'No tokens available' };
        }

        const batchSize = 500;
        let totalSuccess = 0;
        let totalFailure = 0;

        for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);
            const response = await messaging.sendEachForMulticast({
                ...message,
                tokens: batch,
            });
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;
        }

        return { success: true, totalSuccess, totalFailure };
    } catch (error) {
        console.error('Push notification error:', error);
        throw error;
    }
}

module.exports = { sendPushNotification, initializeFirebaseFromDB };
