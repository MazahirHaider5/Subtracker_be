"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const generateOtp = () => {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString();
};
exports.generateOtp = generateOtp;
