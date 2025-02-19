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
exports.logout = exports.resetPassword = exports.verifyOtp = exports.resendOtp = exports.requestOtp = exports.login = void 0;
const bcrytp_1 = require("../utils/bcrytp");
const activity_model_1 = __importDefault(require("../models/activity.model"));
const jwt_1 = require("../utils/jwt");
const users_model_1 = __importDefault(require("../models/users.model"));
const sendMail_1 = require("../utils/sendMail");
const otp_1 = require("../utils/otp");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Email and password are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email }).select("id name email password role domain port secret otp otp_expiry is_verified language currency is_biomatric is_two_factor is_email_notification stripe_customer_id user_type");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        const passwordMatch = yield (0, bcrytp_1.comparePassword)(password, (_a = user.password) !== null && _a !== void 0 ? _a : "");
        if (!passwordMatch) {
            return res
                .status(401)
                .json({ success: false, message: "Incorrect password" });
        }
        if (!user.is_verified) {
            return res
                .status(404)
                .json({ success: false, message: "user not verified" });
        }
        const userPayload = user.toObject();
        delete userPayload.password;
        const accessToken = (0, jwt_1.generateAccessToken)(userPayload);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
        });
        user.last_login = new Date();
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: userPayload,
            accessToken: accessToken
        });
    }
    catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});
exports.login = login;
const requestOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res
            .status(400)
            .json({ success: false, message: "Email is required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        const otp = (0, otp_1.generateOtp)();
        user.otp = otp;
        (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
            yield user.save();
        const subject = "Password Reset OTP";
        const body = `Your OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        return res
            .status(200)
            .json({ success: true, message: "OTP sent to email" });
    }
    catch (error) {
        console.log("Error requesting password reset: ", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.requestOtp = requestOtp;
const resendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res
            .status(400)
            .json({ success: false, message: "Email is required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User not found" });
        }
        if (user.is_verified) {
            return res
                .status(400)
                .json({ success: false, message: "user already verified" });
        }
        //OTP will be sent only when the previous OTP is expired
        if (user.otp_expiry && new Date() < user.otp_expiry) {
            return res
                .status(400)
                .json({ success: false, message: "OTP is still valid" });
        }
        const otp = (0, otp_1.generateOtp)();
        user.otp = otp;
        (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
            (user.is_verified = false);
        yield user.save();
        const subject = "Password Reset OTP";
        const body = `Your new OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        return res
            .status(200)
            .json({ success: true, message: "OTP resent to email" });
    }
    catch (error) {
        console.error("Error resending OTP:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.resendOtp = resendOtp;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res
            .status(400)
            .json({ success: false, message: "Email and otp are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User not found" });
        }
        //checking if otp is correct
        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Incorrect OTP" });
        }
        //checking if otp is expired
        if (user.otp_expiry && new Date() > user.otp_expiry) {
            return res
                .status(400)
                .json({ success: false, message: "OTP has expired" });
        }
        user.is_verified = true;
        yield user.save();
        return res
            .status(200)
            .json({ success: true, message: "OTP verified successfully" });
    }
    catch (error) {
        console.log("Error occured in verifyOtp : ", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.verifyOtp = verifyOtp;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res
            .status(400)
            .json({ success: false, message: "Email and new password are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        //checking if user is verified or not
        if (!user.is_verified) {
            return res
                .status(400)
                .json({ success: false, message: "Otp not verified" });
        }
        const hashedPassword = yield (0, bcrytp_1.hashPassword)(newPassword);
        user.password = hashedPassword;
        user.otp = null;
        user.otp_expiry = null;
        yield user.save();
        yield activity_model_1.default.create({
            userId: user._id,
            activityType: "Password reset"
        });
        return res
            .status(200)
            .json({ success: true, message: "Password reset successfully" });
    }
    catch (error) {
        console.log("Error resetting password: ", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
    }
});
exports.resetPassword = resetPassword;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none"
        });
        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    }
    catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during logout",
            error: error.message
        });
    }
});
exports.logout = logout;
