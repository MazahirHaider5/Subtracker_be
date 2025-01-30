import mongoose, { Schema } from "mongoose";

export interface IActivity extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  activityType: string;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    activityType: { type: String }
  },
  {
    timestamps: true
  }
);
export default mongoose.model<IActivity>("Activity", activitySchema);
