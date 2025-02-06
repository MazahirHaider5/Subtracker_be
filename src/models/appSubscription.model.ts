import mongoose from "mongoose";

export interface ICardSchema extends Document {
  name: string;
  description: string;
  heading: string;
  pricing: Number;
  discountPercentage: Number;
  creditsIncluded: Number;
  membershipPlusFeatures: [string];
  duration: Number;
  priceId: string;
  durationUnit: string;
}
const CardSchema = new mongoose.Schema<ICardSchema>(
  {
    name: {
      type: String,
      required: true
    },
    heading: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    pricing: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    creditsIncluded: {
      type: Number,
      default: 0
    },
    membershipPlusFeatures: {
      type: [String]
    },
    duration: {
      type: Number,
      required: true
    },
    durationUnit: {
      type: String,
      enum: ["month", "year"],
      default: "month"
    },
    priceId: {
      type: String
    }
  },
  { timestamps: true }
);

CardSchema.index({ name: 1 }, { unique: true });

export default mongoose.model<ICardSchema>("Membership-Card", CardSchema);
