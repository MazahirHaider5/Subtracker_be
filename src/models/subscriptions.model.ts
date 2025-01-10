import mongoose, {Schema, Document, Types} from "mongoose";

export interface ISubscriptions extends Document {
    _id: string;
    user: Types.ObjectId;
    subscription_name: string;
    subscription_ctg: Types.ObjectId;
    subscription_desc: string;
    subscription_start: Date;
    subscription_end: Date;
    subscription_billing_cycle: "Monthly" | "Yearly" | "Weekly" | "Daily"; //assuming these will be options from frontend dropdowns
    subscription_price: number;
    subscription_reminder: string;
    photo: string | null;
    pdf: string | null;
}

const SubscriptionSchema: Schema= new Schema<ISubscriptions>({
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
        enum: ["Monthly","Yearly","Weekly", "Daily"],
        required: true,
    },
    subscription_price: {
        type: Number,
        required: true
    },
    subscription_reminder: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: false
    },
    pdf: {
        type: String,
        required: false
    }
});

export default mongoose.model<ISubscriptions>("Subscriptions", SubscriptionSchema);