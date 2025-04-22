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
const SubscriptionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subscription_name: {
        type: String,
        required: true
    },
    subscription_ctg: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        enum: ["Monthly", "Yearly", "Weekly", "Daily"],
        required: true
    },
    subscription_price: {
        type: Number,
        required: true
    },
    subscription_reminder: {
        type: String,
        required: true
    },
    is_paid: {
        type: Boolean,
        default: false
    },
    photo: {
        type: String,
        required: false
    },
    pdf: {
        type: [String],
        required: false
    },
    notifiedBeforeEnd: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model("Subscriptions", SubscriptionSchema);
