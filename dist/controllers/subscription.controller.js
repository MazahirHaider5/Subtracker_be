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
exports.updatePaidStatus = exports.updateSubscription = exports.deleteSubscription = exports.getUserSubscription = exports.createSubscription = void 0;
const subscriptions_model_1 = __importDefault(require("../models/subscriptions.model"));
const categories_model_1 = __importDefault(require("../models/categories.model"));
const multer_1 = require("../config/multer");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = require("mongoose");
const users_model_1 = __importDefault(require("../models/users.model"));
exports.createSubscription = [
    multer_1.upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "pdf", maxCount: 4 }
    ]),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const token = req.cookies.accessToken ||
                (req.headers.authorization && req.headers.authorization.split(" ")[1]);
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized, No token provided"
                });
            }
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.id;
            const user = yield users_model_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            // Check if user's plan is still active
            const { membershipName, purchaseDate, isPaymentComplete } = user;
            if (isPaymentComplete !== "completed") {
                return res.status(403).json({
                    success: false,
                    message: "Payment is incomplete. Please complete payment to continue."
                });
            }
            const purchaseDateObj = new Date(user.purchaseDate);
            let expiryDate = new Date(purchaseDateObj);
            switch (membershipName) {
                case "free_trial":
                    expiryDate.setDate(expiryDate.getDate() + 14);
                    break;
                case "month":
                    expiryDate.setMonth(expiryDate.getMonth() + 1);
                    break;
                case "year":
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                    break;
                case "lifetime":
                    expiryDate = new Date("2099-12-31");
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid membership type"
                    });
            }
            console.log("This is expiry date", expiryDate);
            if (new Date() > expiryDate) {
                return res.status(403).json({
                    success: false,
                    message: "Your subscription plan has expired. Please renew to continue."
                });
            }
            // Extract form fields
            const { subscription_name, subscription_ctg, subscription_desc, subscription_start, subscription_end, subscription_billing_cycle, subscription_price, subscription_reminder } = req.body;
            // Find or resolve the subscription category
            let category;
            if (mongoose_1.Types.ObjectId.isValid(subscription_ctg)) {
                category = yield categories_model_1.default.findById(subscription_ctg);
            }
            else {
                category = yield categories_model_1.default.findOne({ category_name: subscription_ctg });
            }
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }
            const files = req.files;
            const photo = ((_b = (_a = files === null || files === void 0 ? void 0 : files.photo) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) || null;
            const pdf = ((_c = files === null || files === void 0 ? void 0 : files.pdf) === null || _c === void 0 ? void 0 : _c.map((file) => file.path)) || [];
            const newSubscription = new subscriptions_model_1.default({
                user: userId,
                subscription_name,
                subscription_ctg: new mongoose_1.Types.ObjectId(category._id.toString()),
                subscription_desc,
                subscription_start,
                subscription_end,
                subscription_billing_cycle,
                subscription_price,
                subscription_reminder,
                photo,
                pdf
            });
            const savedSubscription = yield newSubscription.save();
            if (!category.monthly_data || !(category.monthly_data instanceof Map)) {
                category.monthly_data = new Map();
            }
            const monthYear = new Date(subscription_start).toISOString().slice(0, 7);
            if (!category.monthly_data.has(monthYear)) {
                category.monthly_data.set(monthYear, { total_spent: 0, subscriptions: [] });
            }
            const monthlyEntry = category.monthly_data.get(monthYear);
            monthlyEntry.subscriptions.push(savedSubscription._id);
            monthlyEntry.total_spent += savedSubscription.subscription_price;
            category.monthly_data.set(monthYear, monthlyEntry);
            category.subscriptions.push(savedSubscription);
            category.markModified("monthly_data");
            yield category.save();
            res.status(200).json({
                success: true,
                message: "Subscription created successfully",
                subscription: savedSubscription
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Error creating subscription"
            });
        }
    })
];
const getUserSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized , No token provided"
            });
        }
        const decodeToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodeToken.id;
        const userSubscription = yield subscriptions_model_1.default.find({ user: userId })
            .populate({
            path: "subscription_ctg",
            select: "category_name"
        });
        const test = yield subscriptions_model_1.default.findOne({ subscription_name: "Hisham Sub 3" }).populate("subscription_ctg");
        console.log("This is test broooooo", test);
        res.status(200).json({
            success: true,
            message: "Subscriptions fetched successfully",
            subscriptions: userSubscription
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
exports.getUserSubscription = getUserSubscription;
exports.deleteSubscription = [
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const subscriptionId = req.params.id;
            const subscription = subscriptions_model_1.default.findOne({
                _id: subscriptionId,
                user: userId
            });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: "Subscription not found"
                });
            }
            yield subscriptions_model_1.default.findByIdAndDelete(subscriptionId);
            res.status(200).json({
                success: true,
                message: "Subscription deleted successfully"
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    })
];
exports.updateSubscription = [
    multer_1.upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "pdf", maxCount: 4 }
    ]),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const token = req.cookies.accessToken ||
                (req.headers.authorization && req.headers.authorization.split(" ")[1]);
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized, No token provided"
                });
            }
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.id;
            const subscriptionId = req.params.id;
            const subscription = yield subscriptions_model_1.default.findOne({
                _id: subscriptionId,
                user: userId
            });
            if (!subscription) {
                return res.status(404).json({
                    success: false,
                    message: "Subscription not found /  not authorized to delete"
                });
            }
            const { subscription_name, subscription_ctg, subscription_desc, subscription_start, subscription_end, subscription_billing_cycle, subscription_price, subscription_reminder } = req.body;
            const files = req.files;
            const photo = ((_b = (_a = files === null || files === void 0 ? void 0 : files.photo) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) || subscription.photo;
            const pdf = ((_c = files === null || files === void 0 ? void 0 : files.pdf) === null || _c === void 0 ? void 0 : _c.map((file) => file.path)) || subscription.pdf;
            subscription.subscription_name =
                subscription_name || subscription.subscription_name;
            subscription.subscription_ctg =
                subscription_ctg || subscription.subscription_ctg;
            subscription.subscription_desc =
                subscription_desc || subscription.subscription_desc;
            subscription.subscription_start =
                subscription_start || subscription.subscription_start;
            subscription.subscription_end =
                subscription_end || subscription.subscription_end;
            subscription.subscription_billing_cycle =
                subscription_billing_cycle || subscription.subscription_billing_cycle;
            subscription.subscription_price =
                subscription_price || subscription.subscription_price;
            subscription.subscription_reminder =
                subscription_reminder || subscription.subscription_reminder;
            subscription.photo = photo;
            subscription.pdf = pdf;
            yield subscription.save();
            return res.status(200).json({
                success: true,
                message: "Subscription Updated successfully",
                subscription
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    })
];
const updatePaidStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, No token provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { id } = req.params;
        const { is_paid } = req.body;
        if (typeof is_paid !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Invalid input. 'is_paid' must be a boolean value."
            });
        }
        const updatedSubscription = yield subscriptions_model_1.default.findOneAndUpdate({ _id: id, user: userId }, { is_paid }, { new: true });
        if (!updatedSubscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found or not authorized"
            });
        }
        res.status(200).json({
            success: true,
            message: "Subscription updated successfully",
            subscription: updatedSubscription
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
exports.updatePaidStatus = updatePaidStatus;
