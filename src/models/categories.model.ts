import mongoose, {Schema, Document, Types} from "mongoose";

export interface ICategory extends Document {
    _id: string,
    user: Types.ObjectId,
    subscription_id : Types.ObjectId[],
    category_name : string,
    category_desc: string,
    category_budget: number,
    category_created: Date,
    active_subscriptions: number,
    total_budget: number,
    spendings: number
}
const CategorySchema: Schema<ICategory> = new Schema ({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subscription_id: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscriptions"
        },
    ],
    category_name: {
        type: String,
        required: true,
        unique: true,
      },
      category_desc: {
        type: String,
      },
      category_budget: {
        type: Number,
        default: 0,
      },
      category_created: {
        type: Date,
        default: Date.now,
      },
      active_subscriptions: {
        type: Number,
        default: 0,
      },
      total_budget: {
        type: Number,
        default: 0,
      },
      spendings: {
        type: Number,
        default: 0,
      },
    });
    
    export default mongoose.model<ICategory>("Category", CategorySchema);
