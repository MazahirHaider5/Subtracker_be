"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const sendMail_1 = require("../utils/sendMail");
const subscriptions_model_1 = __importDefault(require("../models/subscriptions.model"));
const activity_model_1 = __importDefault(require("../models/activity.model"));
const firebase_1 = __importDefault(require("../firebase/firebase"));
// Notification thresholds in milliseconds
const timeFrames = [
    { label: "1_month", ms: 30 * 24 * 60 * 60 * 1000 },
    { label: "1_week", ms: 7 * 24 * 60 * 60 * 1000 },
    { label: "3_days", ms: 3 * 24 * 60 * 60 * 1000 },
    { label: "1_day", ms: 1 * 24 * 60 * 60 * 1000 }
];
// Run every hour
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    console.log(`[Subscription Reminder] Job started at ${now.toISOString()}`);
    try {
        const now = new Date();
        for (const frame of timeFrames) {
            const targetTime = new Date(now.getTime() + frame.ms);
            const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30-min window
            const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);
            console.log(`\n[Reminder Window] Checking subscriptions expiring in ${frame.label.replace("_", " ")}...`);
            console.log(`Target range: ${windowStart.toISOString()} - ${windowEnd.toISOString()}`);
            const query = {
                subscription_end: { $gte: windowStart, $lte: windowEnd },
                [`notified_${frame.label}`]: false
            };
            const subscriptions = yield subscriptions_model_1.default.find(query).populate("user");
            if (subscriptions.length === 0) {
                console.log(`[Info] No subscriptions found for ${frame.label}`);
            }
            for (const sub of subscriptions) {
                const labelReadable = frame.label.replace("_", " ");
                const subject = `Reminder: Your subscription "${sub.subscription_name}" ends in ${labelReadable}`;
                const body = `
Hello,

This is a reminder that your subscription "${sub.subscription_name}" will end on ${sub.subscription_end.toLocaleString()}.

You have ${labelReadable} left. Please consider renewing.

Thanks.`;
                // Email
                yield (0, sendMail_1.sendMail)(sub.user.email, subject, body);
                // Firebase Notification
                if (sub.user.fcmToken) {
                    const message = {
                        notification: {
                            title: subject,
                            body: `Your subscription "${sub.subscription_name}" ends in ${labelReadable}.`
                        },
                        token: sub.user.fcmToken
                    };
                    try {
                        yield firebase_1.default.messaging().send(message);
                        console.log(`[FCM] Push notification sent to ${sub.user.email}`);
                    }
                    catch (fcmError) {
                        console.error(`[FCM Error] Failed for ${sub.user.email}:`, fcmError);
                    }
                }
                else {
                    console.log(`[FCM] No FCM token found for ${sub.user.email}`);
                }
                // Activity log
                yield activity_model_1.default.create({
                    userId: sub.user._id,
                    title: 'Subscription Reminder',
                    activityType: `Reminder: "${sub.subscription_name}" ends in ${labelReadable}`
                });
                // Mark notification sent
                sub[`notified_${frame.label}`] = true;
                yield sub.save();
            }
        }
        console.log(`\n[Subscription Reminder] Job completed at ${new Date().toISOString()}`);
    }
    catch (error) {
        console.error("Subscription reminder error:", error);
    }
}));
