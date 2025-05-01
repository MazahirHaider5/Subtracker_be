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
exports.markActivityAsRead = exports.getLoggedInUserActivities = exports.getAllActivities = void 0;
const activity_model_1 = __importDefault(require("../models/activity.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getAllActivities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activities = yield activity_model_1.default.find().populate({
            path: "userId",
            select: "email"
        });
        res.status(200).json({ success: true, activities });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Error fetching activities" });
    }
});
exports.getAllActivities = getAllActivities;
const getLoggedInUserActivities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Get all activities for the user
        const allActivities = yield activity_model_1.default.find({ userId }).sort({ createdAt: -1 });
        const unreadActivities = allActivities.filter(activity => !activity.isRead);
        const readActivities = allActivities.filter(activity => activity.isRead);
        const totalCount = allActivities.length;
        const unreadCount = unreadActivities.length;
        const readCount = readActivities.length;
        res.status(200).json({
            success: true,
            message: "Activities fetched successfully",
            totalCount,
            unreadCount,
            readCount,
            unreadActivities,
            readActivities
        });
    }
    catch (error) {
        console.error("Error fetching user activities:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching activities"
        });
    }
});
exports.getLoggedInUserActivities = getLoggedInUserActivities;
const markActivityAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { activityId } = req.params;
        console.log("This is activity Id", activityId);
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
        const activity = yield activity_model_1.default.findOneAndUpdate({ _id: activityId, userId }, { isRead: true }, { new: true });
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: "Activity not found or unauthorized"
            });
        }
        res.status(200).json({
            success: true,
            message: "Activity marked as read",
            activity
        });
    }
    catch (error) {
        console.error("Error marking activity as read:", error);
        res.status(500).json({
            success: false,
            message: "Error updating activity"
        });
    }
});
exports.markActivityAsRead = markActivityAsRead;
