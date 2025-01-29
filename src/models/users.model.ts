import mongoose, { Schema, Document } from "mongoose";

// Interface for TypeScript typing
export interface IUser extends Document {
  _id: string;
  googleId?: string;
  appleId?: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  photo?: string;
  stripe_customer_id: string | null;
  user_type: "enterprise" | "admin";
  otp?: string | null;
  otp_expiry?: Date | null;
  is_verified: boolean;
  reset_token?: string;
  reset_token_expiry?: Date;
  language: string;
  currency: string;
  is_biomatric: boolean;
  is_two_factor: boolean;
  is_email_notification: boolean;
  signup_date: Date;
  last_login: Date;
}

// Mongoose schema
const UserSchema: Schema = new Schema<IUser>({
  googleId: { type: String, unique: true, sparse: true },
  appleId: { type: String, unique: true, sparse: true },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  password: {
    type: String,
    default: ""
  },
  photo: {
    type: String
  },
  stripe_customer_id: {
    type: String,
    default: null
  },
  user_type: {
    type: String,
    enum: ["enterprise", "admin"],
    default: "enterprise",
    required: true
  },
  otp: {
    type: String,
    default: null
  },
  otp_expiry: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 1000) // 10 minutes from now
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: "English"
  },
  currency: {
    type: String,
    default: "US"
  },
  is_biomatric: {
    type: Boolean,
    default: false
  },
  is_two_factor: {
    type: Boolean,
    default: false
  },
  is_email_notification: {
    type: Boolean,
    default: false
  },
  signup_date: {
    type: Date,
    default: null
  },
  last_login: {
    type: Date,
    default: null
  },
  reset_token: { type: String },
  reset_token_expiry: { type: Date }
});

export default mongoose.model<IUser>("User", UserSchema);
