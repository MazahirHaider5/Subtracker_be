"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllComplaints = exports.promoteToAdmin = exports.sendAdminPromotionLink = exports.getAllSubscriptions = void 0;
const subscriptions_model_1 = __importDefault(require("../models/subscriptions.model"));
const crypto_1 = __importDefault(require("crypto"));
const sendMail_1 = require("../utils/sendMail");
const users_model_1 = __importDefault(require("../models/users.model"));
const complaints_model_1 = __importDefault(require("../models/complaints.model"));
const getAllSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriptions = yield subscriptions_model_1.default.find()
            .populate({
            path: "user",
            select: "email user_type"
        })
            .populate({
            path: "subscription_ctg",
            select: "category_name"
        });
        res.status(200).json({
            success: true,
            message: "All subscriptions fetched successfully",
            subscriptions
        });
    }
    catch (error) {
        console.error("Error fetching subscriptions: ", error);
        res.status(500).json({
            success: false,
            message: "Error fetching subscriptions, Internal server error"
        });
    }
});
exports.getAllSubscriptions = getAllSubscriptions;
const sendAdminPromotionLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        const token = crypto_1.default.randomBytes(20).toString("hex");
        user.reset_token = token;
        user.reset_token_expiry = new Date(Date.now() + 3600000);
        yield users_model_1.default.updateOne({ email }, {
            $set: {
                reset_token: token,
                reset_token_expiry: user.reset_token_expiry
            }
        });
        console.log("Token sent:", token);
        const promotionLink = `http://localhost:3000/admin/promoteToAdmin?token=${token}`;
        const subject = "Admin Promotion Request";
        const body = `Click the link below to become an admin:\n\n${promotionLink}\n\nThis link will expire in 1 hour.`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        return res.status(200).json({
            success: true,
            message: "Promotion email send successfully"
        });
    }
    catch (error) {
        console.error("Error sending promotion link: ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
exports.sendAdminPromotionLink = sendAdminPromotionLink;
const promoteToAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        console.log("Received token:", token);
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Invalid request, No token provided"
            });
        }
        const user = yield users_model_1.default.findOne({ reset_token: token });
        console.log("Stored token:", user === null || user === void 0 ? void 0 : user.reset_token);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid or Expired token"
            });
        }
        if (user.reset_token_expiry && user.reset_token_expiry < new Date()) {
            console.log("Token Expiry:", user.reset_token_expiry);
            console.log("Current Time:", new Date());
            return res.status(400).json({
                success: false,
                message: "Token expired"
            });
        }
        user.user_type = "admin";
        user.reset_token = undefined;
        user.reset_token_expiry = undefined;
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "User promoted to Admin successfully"
        });
    }
    catch (error) {
        console.error("Error promoting user to admin: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
exports.promoteToAdmin = promoteToAdmin;
const getAllComplaints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const complaints = yield complaints_model_1.default.find().populate("user_id", "name email").sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "All complaints fetched successfully",
            complaints
        });
    }
    catch (error) {
        console.error("Error fetching complaints: ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
exports.getAllComplaints = getAllComplaints;
