import cron from "node-cron";
import { sendMail } from "../utils/sendMail";
import Subscription from "../models/subscriptions.model";
import Activity from "../models/activity.model";
import { IUser } from "../models/users.model";
import { Types } from "mongoose";
import admin from "../firebase/firebase";

interface PopulatedSubscription {
  _id: Types.ObjectId;
  user: IUser & {
    fcmToken?: string;
  };
  subscription_name: string;
  subscription_end: Date;
  notifiedBeforeEnd: boolean;
  save(): Promise<any>;
}

// Run every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    console.log("Current time:", now.toISOString());
    console.log("One hour window until:", oneHourLater.toISOString());

    const subscriptions = await Subscription.find({
      subscription_end: {
        $gt: now,
        $lte: oneHourLater
      },
      notifiedBeforeEnd: false
    }).populate<PopulatedSubscription>("user");

    console.log(
      `Found ${subscriptions.length} subscriptions expiring within 1 hour`
    );

    for (const sub of subscriptions) {
      console.log("Processing subscription:", {
        id: sub._id,
        name: sub.subscription_name,
        endDate: sub.subscription_end,
        userEmail: sub.user.email
      });

      try {
        await Activity.create({
          userId: sub.user._id,
          activityType: `Subscription "${sub.subscription_name}" ending in 1 hour at ${sub.subscription_end.toLocaleString()}`
        });

        const subject = `Subscription Ending Soon: ${sub.subscription_name}`;
        const body = `
Hello,

Your subscription "${sub.subscription_name}" will end in 1 hour at ${sub.subscription_end.toLocaleString()}.

Please renew if you wish to continue enjoying the services.

Thanks.`;

        await sendMail(sub.user.email, subject, body);
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
            await admin.messaging().send(message);
            console.log("Firebase notification sent successfully");
          } catch (firebaseError) {
            console.error("Firebase notification failed:", firebaseError);
          }
        }

        sub.notifiedBeforeEnd = true;
        await sub.save();
        console.log("Subscription marked as notified");
      } catch (error) {
        console.error("Error processing subscription:", sub._id, error);
      }
    }
  } catch (error) {
    console.error("Subscription reminder job error:", error);
  }
});
