import { Request, Response } from "express";
import Subscription, { ISubscriptions } from "../models/subscriptions.model";
import crypto from "crypto";

import { sendMail } from "../utils/sendMail";
import User from "../models/users.model";
import Complaint from "../models/complaints.model";

export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await Subscription.find()
      .populate({
        path: "user",
        select: "email user_type"
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
  } catch (error) {
    console.error("Error fetching subscriptions: ", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subscriptions, Internal server error"
    });
  }
};

export const sendAdminPromotionLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const token = crypto.randomBytes(20).toString("hex");
    user.reset_token = token;
    user.reset_token_expiry = new Date(Date.now() + 3600000);
    await User.updateOne(
      { email },
      {
        $set: {
          reset_token: token,
          reset_token_expiry: user.reset_token_expiry
        }
      }
    );

    console.log("Token sent:", token);
    const promotionLink = `http://localhost:3000/admin/promoteToAdmin?token=${token}`;

    const subject = "Admin Promotion Request";
    const body = `Click the link below to become an admin:\n\n${promotionLink}\n\nThis link will expire in 1 hour.`;

    await sendMail(email, subject, body);

    return res.status(200).json({
      success: true,
      message: "Promotion email send successfully"
    });
  } catch (error) {
    console.error("Error sending promotion link: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    console.log("Received token:", token);
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invalid request, No token provided"
      });
    }
    const user = await User.findOne({ reset_token: token });
    console.log("Stored token:", user?.reset_token);

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

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User promoted to Admin successfully"
    });
  } catch (error) {
    console.error("Error promoting user to admin: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await Complaint.find()
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "All complaints fetched successfully",
      complaints
    });
  } catch (error) {
    console.error("Error fetching complaints: ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const SendSetPasswordLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res
        .status(400)
        .json({ success: false, message: "all fields are required" });
    }
    const check = await User.findOne({ email: email });
    if (check) {
      return res
        .status(404)
        .json({ success: false, message: "user already exists" });
    }
    const user = await User.create({
      email
    });
    const passwordSetLink = `${process.env.FRONT_END_URL}/set-password`;

    const subject = "Set Password  Request";
    const body = `Click the link below to become set password:\n\n${passwordSetLink}\n\n.`;
    await sendMail(email, subject, body);
    res.status(200).json({ success: false, message: "Link sent succesfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error });
  }
};
