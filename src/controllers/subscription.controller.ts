import { Request, Response } from "express";
import Subscription, { ISubscriptions } from "../models/subscriptions.model";
import Category from "../models/categories.model";
import { upload } from "../config/multer";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import usersModel from "../models/users.model";

export const createSubscription = [
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "pdf", maxCount: 4 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const token =
        req.cookies.accessToken ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized, No token provided"
        });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
      };
      const userId = decodedToken.id;

      const user = await usersModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Check if user's plan is still active
      const { membershipName, purchaseDate, isPaymentComplete, signup_date } =
        user;

      const now = new Date();

      // Calculate free trial expiry if applicable
      let isFreeTrialActive = false;
      if (membershipName === "free_trial" && signup_date) {
        const signupDateObj = new Date(signup_date);
        const trialExpiry = new Date(signupDateObj);
        trialExpiry.setDate(trialExpiry.getDate() + 14);
        if (now <= trialExpiry) {
          isFreeTrialActive = true;
        }
      }

      // Block user if payment is not completed and trial is not active
      if (!isFreeTrialActive && isPaymentComplete !== "completed") {
        return res.status(403).json({
          success: false,
          message: "Payment is incomplete. Please complete payment to continue."
        });
      }

      // Calculate subscription expiry
      const purchaseDateObj = new Date(purchaseDate);
      let expiryDate = new Date(purchaseDateObj);

      switch (membershipName) {
        case "free_trial":
          expiryDate.setDate(expiryDate.getDate() + 14);
          break;
        case "month":
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          break;
        case "year":
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          break;
        case "lifetime":
          expiryDate = new Date("2099-12-31");
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid membership type"
          });
      }
      console.log("This is expiry date", expiryDate);

      if (new Date() > expiryDate) {
        return res.status(403).json({
          success: false,
          message:
            "Your subscription plan has expired. Please renew to continue."
        });
      }

      // Extract form fields
      const {
        subscription_name,
        subscription_ctg,
        subscription_desc,
        subscription_start,
        subscription_end,
        subscription_billing_cycle,
        subscription_price,
        subscription_reminder
      } = req.body;

      // Find or resolve the subscription category
      let category;
      if (Types.ObjectId.isValid(subscription_ctg)) {
        category = await Category.findById(subscription_ctg);
      } else {
        category = await Category.findOne({ category_name: subscription_ctg });
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const photo = files?.photo?.[0]?.path || null;
      const pdf = files?.pdf?.map((file) => file.path) || [];

      const newSubscription = new Subscription({
        user: userId,
        subscription_name,
        subscription_ctg: new Types.ObjectId(category._id.toString()),
        subscription_desc,
        subscription_start,
        subscription_end,
        subscription_billing_cycle,
        subscription_price,
        subscription_reminder,
        photo,
        pdf
      });

      const savedSubscription = await newSubscription.save();

      if (!category.monthly_data || !(category.monthly_data instanceof Map)) {
        category.monthly_data = new Map<
          string,
          { total_spent: number; subscriptions: Types.ObjectId[] }
        >();
      }

      const monthYear = new Date(subscription_start).toISOString().slice(0, 7);
      if (!category.monthly_data.has(monthYear)) {
        category.monthly_data.set(monthYear, {
          total_spent: 0,
          subscriptions: []
        });
      }

      const monthlyEntry = category.monthly_data.get(monthYear) as {
        total_spent: number;
        subscriptions: Types.ObjectId[];
      };
      monthlyEntry.subscriptions.push(savedSubscription._id as Types.ObjectId);
      monthlyEntry.total_spent += savedSubscription.subscription_price;
      category.monthly_data.set(monthYear, monthlyEntry);

      category.subscriptions.push(savedSubscription as ISubscriptions);
      category.markModified("monthly_data");

      await category.save();

      res.status(200).json({
        success: true,
        message: "Subscription created successfully",
        subscription: savedSubscription
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error creating subscription"
      });
    }
  }
];

export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized , No token provided"
      });
    }
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };
    const userId = decodeToken.id;
    const userSubscription = await Subscription.find({ user: userId }).populate(
      {
        path: "subscription_ctg",
        select: "category_name"
      }
    );
    const test = await Subscription.findOne({
      subscription_name: "Hisham Sub 3"
    }).populate("subscription_ctg");
    console.log("This is test broooooo", test);

    res.status(200).json({
      success: true,
      message: "Subscriptions fetched successfully",

      subscriptions: userSubscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const deleteSubscription = [
  async (req: Request, res: Response) => {
    try {
      const token =
        req.cookies.accessToken ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized, no token provided"
        });
      }
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      const userId = decodedToken.id;
      const subscriptionId = req.params.id;
      const subscription = Subscription.findOne({
        _id: subscriptionId,
        user: userId
      });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found"
        });
      }
      await Subscription.findByIdAndDelete(subscriptionId);
      res.status(200).json({
        success: true,
        message: "Subscription deleted successfully"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message
      });
    }
  }
];

export const updateSubscription = [
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "pdf", maxCount: 4 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const token =
        req.cookies.accessToken ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized, No token provided"
        });
      }
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      const userId = decodedToken.id;
      const subscriptionId = req.params.id;

      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        user: userId
      });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found /  not authorized to delete"
        });
      }
      const {
        subscription_name,
        subscription_ctg,
        subscription_desc,
        subscription_start,
        subscription_end,
        subscription_billing_cycle,
        subscription_price,
        subscription_reminder
      } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const photo = files?.photo?.[0]?.path || subscription.photo;
      const pdf = files?.pdf?.map((file) => file.path) || subscription.pdf;

      subscription.subscription_name =
        subscription_name || subscription.subscription_name;
      subscription.subscription_ctg =
        subscription_ctg || subscription.subscription_ctg;
      subscription.subscription_desc =
        subscription_desc || subscription.subscription_desc;
      subscription.subscription_start =
        subscription_start || subscription.subscription_start;
      subscription.subscription_end =
        subscription_end || subscription.subscription_end;
      subscription.subscription_billing_cycle =
        subscription_billing_cycle || subscription.subscription_billing_cycle;
      subscription.subscription_price =
        subscription_price || subscription.subscription_price;
      subscription.subscription_reminder =
        subscription_reminder || subscription.subscription_reminder;
      subscription.photo = photo;
      subscription.pdf = pdf;

      await subscription.save();
      return res.status(200).json({
        success: true,
        message: "Subscription Updated successfully",
        subscription
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
];

export const updatePaidStatus = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, No token provided"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };
    const userId = decodedToken.id;
    const { id } = req.params;
    const { is_paid } = req.body;
    if (typeof is_paid !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid input. 'is_paid' must be a boolean value."
      });
    }
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { _id: id, user: userId },
      { is_paid },
      { new: true }
    );
    if (!updatedSubscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found or not authorized"
      });
    }
    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      subscription: updatedSubscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
