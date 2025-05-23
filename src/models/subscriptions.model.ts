import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubscriptions extends Document {
  user: Types.ObjectId;
  subscription_name: string;
  subscription_ctg: Types.ObjectId;
  subscription_desc: string;
  subscription_start: Date;
  subscription_end: Date;
  subscription_billing_cycle: "Monthly" | "Yearly" | "Weekly" | "Daily";
  subscription_price: number;
  subscription_reminder: string;
  is_paid: boolean;
  photo: string | null;
  pdf: string[] | null;
  notifiedBeforeEnd: Boolean;
  notified_1_month: Boolean;
  notified_1_week: Boolean;
  notified_3_days: Boolean;
  notified_1_day: Boolean;
}

const SubscriptionSchema: Schema = new Schema<ISubscriptions>(
  {
    notified_1_month: { type: Boolean, default: false },
    notified_1_week: { type: Boolean, default: false },
    notified_3_days: { type: Boolean, default: false },
    notified_1_day: { type: Boolean, default: false },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    subscription_name: {
      type: String,
      required: true
    },
    subscription_ctg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    subscription_desc: {
      type: String,
      required: false
    },
    subscription_start: {
      type: Date,
      required: true
    },
    subscription_end: {
      type: Date,
      required: true
    },
    subscription_billing_cycle: {
      type: String,
      enum: ["Monthly", "Yearly", "Weekly", "Daily"],
      required: true
    },
    subscription_price: {
      type: Number,
      required: true
    },
    subscription_reminder: {
      type: String,
      required: true
    },
    is_paid: {
      type: Boolean,
      default: false
    },
    photo: {
      type: String,
      required: false
    },
    pdf: {
      type: [String],
      required: false
    },
    notifiedBeforeEnd: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ISubscriptions>(
  "Subscriptions",
  SubscriptionSchema
);
