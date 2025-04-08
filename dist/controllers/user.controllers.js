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
exports.getUserDetails = exports.setPassword = exports.updateSpecificFields = exports.changeCurrency = exports.changeLanguage = exports.updateUser = exports.verifySignupOtp = exports.deleteAccount = exports.userSignup = exports.getUsers = void 0;
const users_model_1 = __importDefault(require("../models/users.model"));
const activity_model_1 = __importDefault(require("../models/activity.model"));
const bcrytp_1 = require("../utils/bcrytp");
const sendMail_1 = require("../utils/sendMail");
const multer_1 = require("../config/multer");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = __importDefault(require("validator"));
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, email, user_type } = req.query;
    try {
        if (user_type && !["enterprise", "admin"].includes(user_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role provided"
            });
        }
        if (id || email) {
            const user = yield users_model_1.default.findOne(Object.assign({ $or: [{ _id: id }, { email: email }] }, (user_type && { user_type }))).select("-password");
            if (!user) {
                return res
                    .status(404)
                    .json({ success: false, message: "User not found" });
            }
            return res.status(200).json({ success: true, data: user });
        }
        const query = {};
        if (user_type)
            query.user_type = user_type;
        const users = yield users_model_1.default.find(query).select("-password");
        if (!users.length) {
            return res
                .status(404)
                .json({ success: false, message: "No users found" });
        }
        return res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while fetching users",
            error: error.message
        });
    }
});
exports.getUsers = getUsers;
const userSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, userName } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    // Validate email format
    if (!validator_1.default.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    try {
        const existingUser = yield users_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }
        const hashedPassword = yield (0, bcrytp_1.hashPassword)(password);
        const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
        const user = yield users_model_1.default.create({
            email,
            name: userName || "Subtracker User",
            password: hashedPassword,
            otp: generatedOTP,
            otp_expiry: new Date(Date.now() + 90 * 1000),
            signup_date: new Date(),
            is_verified: false
        });
        const subject = "Subtrack Email Verification Mail";
        const body = `Your OTP is ${generatedOTP}. It will expire in 90 seconds.`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        return res.status(201).json({
            success: true,
            message: "OTP sent to your email. Please verify to complete registration."
        });
    }
    catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while creating the user",
            error: error.message
        });
    }
});
exports.userSignup = userSignup;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, no token provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const user = yield users_model_1.default.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting the account",
            error: error.message
        });
    }
});
exports.deleteAccount = deleteAccount;
const verifySignupOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res
            .status(400)
            .json({ success: false, message: "Email and OTP are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: "user not fou" });
        }
        if ((user === null || user === void 0 ? void 0 : user.otp) !== otp) {
            return res.status(400).json({ success: false, message: "Incorrect OTP" });
        }
        if ((user === null || user === void 0 ? void 0 : user.otp_expiry) &&
            new Date(user.otp_expiry) instanceof Date &&
            new Date() > new Date(user.otp_expiry)) {
            return res
                .status(400)
                .json({ success: false, message: "otp is expired" });
        }
        user.is_verified = true;
        yield user.save();
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully. You can now sign in."
        });
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
exports.verifySignupOtp = verifySignupOtp;
exports.updateUser = [
    multer_1.uploadImageOnly.single("photo"),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const token = req.cookies.accessToken ||
                (req.headers.authorization && req.headers.authorization.split(" ")[1]);
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized , token not provided"
                });
            }
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.id;
            const user = yield users_model_1.default.findById(userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }
            const { email, name, phone } = req.body;
            if (email)
                user.email = email;
            if (name)
                user.name = name;
            if (phone)
                user.phone = phone;
            if (req.file) {
                user.photo = req.file.path;
            }
            yield user.save();
            yield activity_model_1.default.create({
                userId: user._id,
                activityType: "profile updated"
            });
            return res.status(200).json({
                success: true,
                message: "Updated successfully",
                user
            });
        }
        catch (error) {
            console.error("Error updating user", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    })
];
const changeLanguage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. token not provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { language } = req.body;
        if (!language) {
            return res.status(400).json({
                success: false,
                message: "Language is required"
            });
        }
        const updatedUser = yield users_model_1.default.findByIdAndUpdate(userId, { language }, { new: true });
        if (!exports.updateUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Language updated successfully",
            user: updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating language"
        });
    }
});
exports.changeLanguage = changeLanguage;
const changeCurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. token not provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { currency } = req.body;
        if (!currency) {
            return res.status(400).json({
                success: false,
                message: "Currency is required"
            });
        }
        const updatedUser = yield users_model_1.default.findByIdAndUpdate(userId, { currency }, { new: true });
        if (!exports.updateUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Currency updated successfully",
            user: updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating currency"
        });
    }
});
exports.changeCurrency = changeCurrency;
// for updating is_biomatric, is_two_factor , is_email_notification, currency, language,
// using a single controller when user can update a single or multiple fields using params
const updateSpecificFields = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token not provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { language, currency, is_biomatric, is_two_factor, is_email_notification } = req.body;
        const updateFields = {};
        if (language)
            updateFields.language = language;
        if (currency)
            updateFields.currency = currency;
        if (typeof is_biomatric == "boolean")
            updateFields.is_biomatric = is_biomatric;
        if (typeof is_two_factor == "boolean")
            updateFields.is_two_factor = is_two_factor;
        if (typeof is_email_notification == "boolean")
            updateFields.is_email_notification = is_email_notification;
        if (Object.keys(updateFields).length == 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided to update"
            });
        }
        const updatedUser = yield users_model_1.default.findByIdAndUpdate(userId, updateFields, {
            new: true
        });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error updating user fields"
        });
    }
});
exports.updateSpecificFields = updateSpecificFields;
const setPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Email and password are required" });
    }
    try {
        const user = yield users_model_1.default.findOne({ email: email });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "user doesnot exits" });
        }
        if (((_a = user.password) === null || _a === void 0 ? void 0 : _a.length) == 0) {
            return res
                .status(400)
                .json({ success: false, message: "Enter invited email" });
        }
        const hashedPassword = yield (0, bcrytp_1.hashPassword)(password);
        user.password = hashedPassword;
        user.is_verified = true;
        yield user.save();
        res
            .status(200)
            .json({ success: true, message: "password set succesfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error });
    }
});
exports.setPassword = setPassword;
const getUserDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, no token provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const user = yield users_model_1.default.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            success: false,
            data: user
        });
    }
    catch (error) {
        console.error("Error fetching user details:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching user details",
            error: error.message
        });
    }
});
exports.getUserDetails = getUserDetails;
