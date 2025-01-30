import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComplaint extends Document {
  user_id: Types.ObjectId;
  ticket_id: string;
  issue:
    | "Technical Issue"
    | "Downtime"
    | "Billing Issue"
    | "Account Access"
    | "Other";
  subject: string;
  status: string;
  description: string;
  reply: string;
  createdAt: Date;
}

const generateTicketID = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const ComplaintSchema: Schema = new Schema<IComplaint>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, set: (id: string) => new mongoose.Types.ObjectId(id) },
    ticket_id: { type: String, unique: true, default: generateTicketID },
    issue: {
      type: String,
      enum: [
        "Technical Issue",
        "Downtime",
        "Billing Issue",
        "Account Access",
        "Other"
      ],
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Resolved"],
      default: "Pending"
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    reply: {
      type: String,
      default: ""
    },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IComplaint>("Complaint", ComplaintSchema);
