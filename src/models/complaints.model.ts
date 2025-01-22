import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComplaint extends Document {
  user_id: Types.ObjectId;
  ticket_id: string;
  issue: "Technical Issue" | "Downtime" | "Billing Issue" | "Account Access" | "Other";
  subject: string;
  description: string;
  createdAt: Date;
}

const generateTicketID = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const ComplaintSchema: Schema = new Schema<IComplaint>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ticket_id: { type: String, unique: true, default: generateTicketID },
    issue: {
      type: String,
      enum: ["Technical Issue", "Downtime", "Billing Issue", "Account Access", "Other"],
      required: true,
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IComplaint>("Complaint", ComplaintSchema);
