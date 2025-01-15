import { Request, Response } from "express";
import { comparePassword, hashPassword } from "../utils/bcrytp";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
} from "../utils/jwt";
import User, { IUser } from "../models/users.model";
import { sendMail } from "../utils/sendMail";
import { generateOtp } from "../utils/otp";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }
  try {
    // Use Mongoose to find the user by email
    const user = await User.findOne({ email }).select(
      "id name email password role domain port secret otp otp_expiry is_verified language currency is_biomatric is_two_factor is_email_notification stripe_customer_id"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password ?? "");
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    // Cast the Mongoose user object to match the User type expected by JWT functions
    const userPayload: IUser = user.toObject();
    delete userPayload.password; 

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    // Set cookies with the generated tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Ensure cookies are sent over HTTPS
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiration
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userPayload,
      accessToken : accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const otp = generateOtp();

    user.otp = otp;
    (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
      await user.save();

    const subject = "Password Reset OTP";
    const body = `Your OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
    await sendMail(email, subject, body);

    return res
      .status(200)
      .json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.log("Error requesting password reset: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    //OTP will be sent only when the previous OTP is expired
    if (user.otp_expiry && new Date() < user.otp_expiry) {
      return res
        .status(400)
        .json({ success: false, message: "OTP is still valid" });
    }
    const otp = generateOtp();
    user.otp = otp;
    (user.otp_expiry = new Date(Date.now() + 90 * 1000)), // 90 seconds expiry
      (user.is_verified = false);

    await user.save();

    const subject = "Password Reset OTP";
    const body = `Your new OTP for password reset is: ${otp}. It will expire in 90 seconds.`;
    await sendMail(email, subject, body);

    return res
      .status(200)
      .json({ success: true, message: "OTP resent to email" });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and otp are required" });
  }
  try {
    const user = await User.findOne({ email });
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
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.log("Error occured in verifyOtp : ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Email and new password are required" });
  }
  try {
    const user = await User.findOne({ email });
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
    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;
    user.otp = null;
    user.otp_expiry = null;
    user.is_verified = false;

    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.log("Error resetting password: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none"
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none"
    });
    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
      error: (error as Error).message
    });
  }
};
