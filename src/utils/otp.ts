import { randomBytes } from "crypto";

export const generateOtp = () : string => {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString();
};