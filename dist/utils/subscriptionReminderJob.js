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
// Run every minute
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
        console.log("Current time:", now.toISOString());
        console.log("One hour window until:", oneHourLater.toISOString());
        const subscriptions = yield subscriptions_model_1.default.find({
            subscription_end: {
                $gt: now,
                $lte: oneHourLater
            },
            notifiedBeforeEnd: false
        }).populate("user");
        console.log(`Found ${subscriptions.length} subscriptions expiring within 1 hour`);
        for (const sub of subscriptions) {
            console.log("Processing subscription:", {
                id: sub._id,
                name: sub.subscription_name,
                endDate: sub.subscription_end,
                userEmail: sub.user.email
            });
            try {
                yield activity_model_1.default.create({
                    userId: sub.user._id,
                    title: 'Subscription ending',
                    activityType: `Subscription "${sub.subscription_name}" ending in 1 hour at ${sub.subscription_end.toLocaleString()}`
                });
                const subject = `Subscription Ending Soon: ${sub.subscription_name}`;
                const body = `
Hello,

Your subscription "${sub.subscription_name}" will end in 1 hour at ${sub.subscription_end.toLocaleString()}.

Please renew if you wish to continue enjoying the services.

Thanks.`;
                yield (0, sendMail_1.sendMail)(sub.user.email, subject, body);
                console.log("Email sent to:", sub.user.email);
                console.log("This is user FCM token:", sub.user.fcmToken);
                // Send Firebase notification if FCM token exists
                if (sub.user.fcmToken) {
                    const message = {
                        notification: {
                            title: subject,
                            body: `Your subscription "${sub.subscription_name}" will end in 1 hour.`
                        },
                        token: sub.user.fcmToken
                    };
                    try {
                        yield firebase_1.default.messaging().send(message);
                        console.log("Firebase notification sent successfully");
                    }
                    catch (firebaseError) {
                        console.error("Firebase notification failed:", firebaseError);
                    }
                }
                sub.notifiedBeforeEnd = true;
                yield sub.save();
                console.log("Subscription marked as notified");
            }
            catch (error) {
                console.error("Error processing subscription:", sub._id, error);
            }
        }
    }
    catch (error) {
        console.error("Subscription reminder job error:", error);
    }
}));
