import mongoose, { Schema, Document } from "mongoose";

// Interface for TypeScript typing
export interface IUser extends Document {
  _id: string;
  googleId?: string;
  email: string;
  name: string;
  phone?: string;
  password?: string;
  photo?: string;
  stripe_customer_id: string | null;
  user_type: string;
  otp?: string | null;
  otp_expiry?: Date | null;
  is_verified: boolean;
  reset_token?: string;
  reset_token_expiry?: Date;
}

// Mongoose schema
const UserSchema: Schema = new Schema<IUser>({
  googleId: { type: String, unique: true, sparse: true },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false
  },
  password: {
    type: String,
    default: "",
    required: true
  },
  photo: {
    type: String,
  },
  stripe_customer_id: {
    type: String,
    default: null
  },
  user_type: {
    type: String,
    required: false
  },
  otp: {
    type: String,
    default: null
  },
  otp_expiry: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  },
  is_verified: {
    type: Boolean,
    default: false
  }
});

// Export the Mongoose model
export default mongoose.model<IUser>("User", UserSchema);
