"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = exports.verifyToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken = (user) => {
    console.log(user);
    return jsonwebtoken_1.default.sign({ id: user._id, email: user.email, user_type: user.user_type }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    });
};
exports.generateAccessToken = generateAccessToken;
const verifyToken = (token, secret) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (_a) {
        throw new Error("Invalid token");
    }
};
exports.verifyToken = verifyToken;
const verifyAccessToken = (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "No token provided" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};
exports.verifyAccessToken = verifyAccessToken;
