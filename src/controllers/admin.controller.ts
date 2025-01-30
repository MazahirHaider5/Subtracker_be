import { Request, Response } from "express";
import Subscription from "../models/subscriptions.model";
import crypto from "crypto";
import { getStartDate } from "../utils/getStartDate";
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

    const resolved = await Complaint.find({
      status: "Resolved"
    }).countDocuments();
    const pending = await Complaint.find({
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

export const replyToComplaint = async (req: Request, res: Response) => {
  const { ticket_id, replyText, email } = req.body;
  if (!ticket_id || !replyText || !email) {
    return res
      .status(400)
      .json({ success: false, message: "fields are missing" });
  }
  try {
    const complaint = await Complaint.findOne({ ticket_id });
    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "ticket not found" });
    }
    const user = await User.findOne({ email: email });
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

    await sendMail(email, "Ticket reply", emailBody);
    complaint.status = "Resolved";
    complaint.reply = replyText;
    await complaint.save();
    res.status(200).json({ success: true, message: "reply done successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const activateOrDeactivateUser = async (req: Request, res: Response) => {
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
    const user = await User.findById(user_id);
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
      } else {
        user.is_active = true;
        await user.save();
        return res
          .status(200)
          .json({ success: true, message: "user activated successfully" });
      }
    } else {
      if (!user.is_active) {
        return res
          .status(400)
          .json({ success: false, message: "user is already deactivated" });
      } else {
        user.is_active = false;
        await user.save();
        return res
          .status(200)
          .json({ success: true, message: "user deactivated successfully" });
      }
    }
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getInfoAboutUsers = async (req: Request, res: Response) => {
  try {
    const activeUsers = await User.find({ is_active: true }).countDocuments();
    const inactiveUsers = await User.find({
      is_active: false
    }).countDocuments();
    return res
      .status(200)
      .json({ success: true, message: { activeUsers, inactiveUsers } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDataOnTimeFrame = async (req: Request, res: Response) => {
  try {
    const timeframe =
      typeof req.query.timeframe === "string" ? req.query.timeframe : "weekly";

    const startDate = getStartDate(timeframe);
    let groupBy, sortKey;

    if (timeframe === "weekly") {
      groupBy = { $dayOfWeek: "$createdAt" }; // 1 (Sunday) to 7 (Saturday)
      sortKey = "_id";
    } else if (timeframe === "monthly") {
      groupBy = { $month: "$createdAt" }; // 1 (January) to 12 (December)
      sortKey = "_id";
    } else if (timeframe === "yearly") {
      groupBy = { $year: "$createdAt" }; // Group by year (e.g., 2019, 2020, etc.)
      sortKey = "_id";
    } else {
      return res.status(400).json({ error: "Invalid timeframe" });
    }

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: groupBy, count: { $sum: 1 } } },
      { $sort: { [sortKey]: 1 } } // Sort ascending
    ]);

    res.json({ timeframe, data });
  } catch (error) {
    res.status(500).json({ error: "Error fetching data", details: error });
  }
};
