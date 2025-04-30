import { Request, Response } from "express";
import { comparePassword, hashPassword } from "../utils/bcrytp";
import Activity from "../models/activity.model";
import { generateAccessToken } from "../utils/jwt";
import User, { IUser } from "../models/users.model";
import { sendMail } from "../utils/sendMail";
import { generateOtp } from "../utils/otp";

export const login = async (req: Request, res: Response) => {
  const { email, password, fcmToken } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email }).select(
      "id name email password photo phone language currency is_biomatric is_face_auth is_two_factor is_email_notification stripe_customer_id user_type is_verified is_active signup_date last_login"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const passwordMatch = await comparePassword(password, user.password ?? "");
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }
    if (!user.is_verified) {
      return res
        .status(404)
        .json({ success: false, message: "user not verified" });
    }
    
   
    const userPayload: IUser = user.toObject();
    delete userPayload.password;
    delete userPayload.otp;
    delete userPayload.otp_expiry;
    delete userPayload.reset_token;
    delete userPayload.reset_token_expiry;

    const accessToken = generateAccessToken(userPayload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only true in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' for cross-origin; 'lax' is okay for dev
      maxAge: 24 * 60 * 60 * 1000
    });
    user.fcmToken = fcmToken;
    user.last_login = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userPayload,
      accessToken: accessToken,
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

export const verifySignupOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required" });
  }

  try {
    const user: IUser | null = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ success: false, message: "user not found" });
    }

    if (user?.otp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    if (
      user?.otp_expiry &&
      new Date(user.otp_expiry) instanceof Date &&
      new Date() > new Date(user.otp_expiry)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "otp is expired" });
    }
    user.is_verified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now sign in."
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.otp && user.otp_expiry && new Date(user.otp_expiry) > new Date()) {
      return res.status(429).json({
        success: false,
        message: `OTP already sent. Please wait before requesting a new one.`,
      });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otp_expiry = new Date(Date.now() + 60 * 1000); // 60 seconds expiry
    await user.save();

    const subject = "Password Reset OTP";
    const body = `Your OTP for password reset is: ${otp}. It will expire in 60 seconds.`;
    await sendMail(email, subject, body);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email.",
    });

  } catch (error) {
    console.error("Error requesting password reset: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: "User is already verified" });
    }

    if (user.otp_expiry && new Date(user.otp_expiry) > new Date()) {
      const remainingTime = Math.ceil((user.otp_expiry.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `OTP already sent. Please wait ${remainingTime} seconds before requesting a new one.`,
      });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otp_expiry = new Date(Date.now() + 60 * 1000); // 60 seconds expiry
    user.is_verified = false;
    await user.save();

    const subject = "OTP Verification email for Subtracker";
    const body = `Your new OTP for Account Verification is: ${otp}. It will expire in 60 seconds.`;
    await sendMail(email, subject, body);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email. Please check your inbox.",
    });

  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

    await user.save();
    await Activity.create({
      userId: user._id,
      activityType: "Password reset"
    });
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

export const socialLogin = async (req: Request, res: Response) => {
  const { name, email, photo, provider } = req.body;

  if (!email || !provider) {
    return res
      .status(400)
      .json({ success: false, message: "Email and provider are required" });
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        photo: photo || undefined,
        googleId: provider === "google" ? req.body.googleId : undefined,
        signup_date: new Date(),
        last_login: new Date(),
        is_verified: true,
        is_active: true,
      });

      await user.save();
    } else {
      user.last_login = new Date();
      await user.save();
    }

    const userPayload: IUser = user.toObject();
    delete userPayload.password;
    delete userPayload.otp;
    delete userPayload.otp_expiry;
    delete userPayload.reset_token;
    delete userPayload.reset_token_expiry;

    const accessToken = generateAccessToken(userPayload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Social login successful",
      user: userPayload,
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("Error during social login:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and Password required"
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 60 * 1000);

    const newUser = new User({
      email,
      password: await hashPassword(password),
      name: "Subtracker User",
      otp,
      otp_expiry: otpExpiry,
      is_verified: false
    });
    
    await newUser.save();
    console.log("New user created:", newUser);

    const subject = "Your Signup OTP";
    const body = `Your OTP for signup is: ${otp}. It will expire in 60 seconds.`;
    await sendMail(email, subject, body);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email for verification.",
    });

  } catch (error) {
    console.error("Error during signup: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const requestPasswordResetOtp = async (req: Request, res: Response) => {
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

export const resendPasswordResetOtp = async (req: Request, res: Response) => {
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

export const verifyPasswordResetOtp = async (req: Request, res: Response) => {
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



