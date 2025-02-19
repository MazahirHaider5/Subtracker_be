"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CardSchema = new mongoose_1.default.Schema({
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
}, { timestamps: true });
CardSchema.index({ name: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Membership-Card", CardSchema);
