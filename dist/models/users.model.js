"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Mongoose schema
const UserSchema = new mongoose_1.Schema({
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
        default: "enterprise"
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
    is_face_auth: {
        type: Boolean,
        default: false
    },
    is_two_factor: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
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
    fcmToken: {
        type: String,
        default: null
    },
    reset_token: { type: String },
    reset_token_expiry: { type: Date },
    stripeCustomerId: { type: String },
    membershipName: {
        type: String,
        default: "Free"
    },
    lastTransactionId: { type: String },
    purchaseDate: { type: String },
    credits: { type: Number, default: 1000 }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model("User", UserSchema);
