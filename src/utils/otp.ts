import { randomBytes } from "crypto";

export const generateOtp = () : string => {
    const otp = randomBytes(3).toString('hex');
    return otp.slice(0,6);
};