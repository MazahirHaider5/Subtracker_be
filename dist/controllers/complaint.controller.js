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
exports.getUserComplaints = exports.createComplaint = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const complaints_model_1 = __importDefault(require("../models/complaints.model"));
const createComplaint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, No token provided",
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { issue, subject, description } = req.body;
        if (!issue || !subject || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const newComplaint = new complaints_model_1.default({
            user_id: userId,
            issue,
            subject,
            description,
        });
        const savedComplaint = yield newComplaint.save();
        return res.status(201).json({
            success: true,
            message: "Complaint submitted successfully",
            complaint: savedComplaint,
        });
    }
    catch (error) {
        console.error("Error creating complaint:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
exports.createComplaint = createComplaint;
const getUserComplaints = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const complaints = yield complaints_model_1.default.find({ user_id: userId }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "User complaints fetched successfully",
            complaints
        });
    }
    catch (error) {
        console.error("Error fetching user complaints: ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
exports.getUserComplaints = getUserComplaints;
