import mongoose, { Schema, Document, Types } from "mongoose";
import { ISubscriptions } from "./subscriptions.model";

export interface ICategory extends Document {
  _id: string;
  user: Types.ObjectId;
  subscriptions: ISubscriptions[];
  category_name: string;
  category_desc: string;
  category_budget: number;
  active_subscriptions: number;
  total_budget: number;
  spendings: number;
  createdAt: Date; 
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    subscriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscriptions"
      }
    ],
    category_name: {
      type: String,
      required: true,
      unique: true
    },
    category_desc: {
      type: String
    },
    category_budget: {
      type: Number,
      default: 0
    },
    active_subscriptions: {
      type: Number,
      default: 0
    },
    total_budget: {
      type: Number,
      default: 0
    },
    spendings: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true } // for automatically creating createdAt and updatedAt fields
);

export default mongoose.model<ICategory>("Category", CategorySchema);
