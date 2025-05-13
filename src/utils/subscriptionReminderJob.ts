import cron from "node-cron";
import { sendMail } from "../utils/sendMail";
import Subscription from "../models/subscriptions.model";
import Activity from "../models/activity.model";
import { IUser } from "../models/users.model";
import { Types } from "mongoose";
import admin from "../firebase/firebase";

interface PopulatedSubscription {
  _id: Types.ObjectId;
  user: IUser & { fcmToken?: string };
  subscription_name: string;
  subscription_end: Date;
  notified_1_month: boolean;
  notified_1_week: boolean;
  notified_3_days: boolean;
  notified_1_day: boolean;
  save(): Promise<any>;
}

// Notification thresholds in milliseconds
const timeFrames = [
  { label: "1_month", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "1_week", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "3_days", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "1_day", ms: 1 * 24 * 60 * 60 * 1000 }
];

// Run every hour
cron.schedule("* * * * *", async () => {
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

      const query: any = {
        subscription_end: { $gte: windowStart, $lte: windowEnd },
        [`notified_${frame.label}`]: false
      };

      const subscriptions = await Subscription.find(query).populate<PopulatedSubscription>("user");

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
        await sendMail(sub.user.email, subject, body);

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
              await admin.messaging().send(message);
              console.log(`[FCM] Push notification sent to ${sub.user.email}`);
            } catch (fcmError) {
              console.error(`[FCM Error] Failed for ${sub.user.email}:`, fcmError);
            }
          } else {
            console.log(`[FCM] No FCM token found for ${sub.user.email}`);
          }

        // Activity log
        await Activity.create({
          userId: sub.user._id,
          title: 'Subscription Reminder',
          activityType: `Reminder: "${sub.subscription_name}" ends in ${labelReadable}`
        });

        // Mark notification sent
        (sub as any)[`notified_${frame.label}`] = true;
        await sub.save();
      }
    }
    console.log(`\n[Subscription Reminder] Job completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("Subscription reminder error:", error);
  }
});
