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
exports.getDataOnTimeFrame = exports.getInfoAboutUsers = exports.activateOrDeactivateUser = exports.replyToComplaint = exports.SendSetPasswordLink = exports.getAllComplaints = exports.promoteToAdmin = exports.sendAdminPromotionLink = exports.getAllSubscriptions = exports.getDataOfSubscribedOrNot = void 0;
const subscriptions_model_1 = __importDefault(require("../models/subscriptions.model"));
const crypto_1 = __importDefault(require("crypto"));
const getStartDate_1 = require("../utils/getStartDate");
const sendMail_1 = require("../utils/sendMail");
const users_model_1 = __importDefault(require("../models/users.model"));
const complaints_model_1 = __importDefault(require("../models/complaints.model"));
const getDataOfSubscribedOrNot = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.getDataOfSubscribedOrNot = getDataOfSubscribedOrNot;
const getAllSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriptions = yield subscriptions_model_1.default.find()
            .populate({
            path: "user",
            select: "email user_type name"
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
        const complaints = yield complaints_model_1.default.find()
            .populate("user_id", "name email")
            .sort({ createdAt: -1 });
        const resolved = yield complaints_model_1.default.find({
            status: "Resolved"
        }).countDocuments();
        const pending = yield complaints_model_1.default.find({
            status: "Pending"
        }).countDocuments();
        return res.status(200).json({
            success: true,
            message: "All complaints fetched successfully",
            complaints,
            resolved,
            pending,
            total: complaints.length
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
const SendSetPasswordLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res
                .status(400)
                .json({ success: false, message: "all fields are required" });
        }
        const check = yield users_model_1.default.findOne({ email: email });
        if (check) {
            return res
                .status(404)
                .json({ success: false, message: "user already exists" });
        }
        const user = yield users_model_1.default.create({
            email
        });
        const passwordSetLink = `${process.env.FRONT_END_URL}/set-password`;
        const subject = "Set Password  Request";
        const body = `Click the link below to become set password:\n\n${passwordSetLink}\n\n.`;
        yield (0, sendMail_1.sendMail)(email, subject, body);
        res.status(200).json({ success: false, message: "Link sent succesfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error });
    }
});
exports.SendSetPasswordLink = SendSetPasswordLink;
const replyToComplaint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ticket_id, replyText, email } = req.body;
    if (!ticket_id || !replyText || !email) {
        return res
            .status(400)
            .json({ success: false, message: "fields are missing" });
    }
    try {
        const complaint = yield complaints_model_1.default.findOne({ ticket_id });
        if (!complaint) {
            return res
                .status(404)
                .json({ success: false, message: "ticket not found" });
        }
        const user = yield users_model_1.default.findOne({ email: email });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "user not found" });
        }
        const emailBody = `
      Dear ${user.name},

      Thank you for reaching out to us via our support section. We have received your concern regarding ${complaint.issue}, and we appreciate your patience.

      Our Response:
      ${replyText}

      If you need any further assistance, please feel free to reply to this email or contact us at support@subtracker.com.

      Best regards,
      Support Team
      SubTracker
      support@subtracker.com
    `;
        yield (0, sendMail_1.sendMail)(email, "Ticket reply", emailBody);
        complaint.status = "Resolved";
        complaint.reply = replyText;
        yield complaint.save();
        res.status(200).json({ success: true, message: "reply done successfully" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.replyToComplaint = replyToComplaint;
const activateOrDeactivateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { action, user_id } = req.query;
    if (!action) {
        return res
            .status(400)
            .json({ success: false, message: "action is not defined" });
    }
    if (!(action === "activate" || action === "deactivate")) {
        return res.status(404).json({
            success: false,
            message: "action should be activate or deactivate"
        });
    }
    try {
        const user = yield users_model_1.default.findById(user_id);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "user not found" });
        }
        if (action === "activate") {
            if (user.is_active) {
                return res
                    .status(400)
                    .json({ success: false, message: "user is already active" });
            }
            else {
                user.is_active = true;
                yield user.save();
                return res
                    .status(200)
                    .json({ success: true, message: "user activated successfully" });
            }
        }
        else {
            if (!user.is_active) {
                return res
                    .status(400)
                    .json({ success: false, message: "user is already deactivated" });
            }
            else {
                user.is_active = false;
                yield user.save();
                return res
                    .status(200)
                    .json({ success: true, message: "user deactivated successfully" });
            }
        }
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
exports.activateOrDeactivateUser = activateOrDeactivateUser;
const getInfoAboutUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeUsers = yield users_model_1.default.find({ is_active: true }).countDocuments();
        const inactiveUsers = yield users_model_1.default.find({
            is_active: false
        }).countDocuments();
        return res
            .status(200)
            .json({ success: true, message: { activeUsers, inactiveUsers } });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.getInfoAboutUsers = getInfoAboutUsers;
const getDataOnTimeFrame = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timeframe = typeof req.query.timeframe === "string" ? req.query.timeframe : "weekly";
        const startDate = (0, getStartDate_1.getStartDate)(timeframe);
        let groupBy, sortKey;
        // Define days of the week and months of the year
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const monthsOfYear = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];
        if (timeframe === "weekly") {
            groupBy = { $dayOfWeek: "$createdAt" }; // Group by day of the week
            sortKey = "_id";
        }
        else if (timeframe === "monthly") {
            groupBy = { $month: "$createdAt" }; // Group by month
            sortKey = "_id";
        }
        else if (timeframe === "yearly") {
            groupBy = { $year: "$createdAt" }; // Group by year
            sortKey = "_id";
        }
        else {
            return res.status(400).json({ error: "Invalid timeframe" });
        }
        // Aggregation pipeline
        const data = yield users_model_1.default.aggregate([
            { $match: { createdAt: { $gte: startDate } } }, // Filter by start date
            { $group: { _id: groupBy, count: { $sum: 1 } } }, // Group by the time frame
            { $sort: { [sortKey]: 1 } } // Sort by day, month, or year
        ]);
        let result;
        if (timeframe === "weekly") {
            // Map data to days of the week
            result = daysOfWeek.map((day, index) => {
                // Adjust for 1-based indexing (Sunday is 1)
                const dayData = data.find((d) => d._id === index + 1);
                return {
                    day,
                    count: dayData ? dayData.count : 0 // Default to 0 if no data
                };
            });
            // Structure data for the response
            const dataSets = {
                Weekly: {
                    series: [
                        { name: "Users", type: "area", data: result.map((d) => d.count) }
                    ],
                    categories: daysOfWeek
                }
            };
            return res.json(dataSets);
        }
        else if (timeframe === "monthly") {
            // Map data to months
            result = monthsOfYear.map((month, index) => {
                const monthData = data.find((d) => d._id === index + 1);
                return {
                    month,
                    count: monthData ? monthData.count : 0 // Default to 0 if no data
                };
            });
            // Structure data for the response
            const dataSets = {
                Monthly: {
                    series: [
                        { name: "Users", type: "area", data: result.map((d) => d.count) }
                    ],
                    categories: monthsOfYear
                }
            };
            return res.json(dataSets);
        }
        else if (timeframe === "yearly") {
            // Structure yearly data
            result = data.map((d) => ({
                year: d._id,
                count: d.count
            }));
            const dataSets = {
                Yearly: {
                    series: [
                        { name: "Users", type: "area", data: result.map((d) => d.count) }
                    ],
                    categories: result.map((d) => d.year.toString())
                }
            };
            return res.json(dataSets);
        }
    }
    catch (error) {
        res.status(500).json({ error: "Error fetching data", details: error });
    }
});
exports.getDataOnTimeFrame = getDataOnTimeFrame;
