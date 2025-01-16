import { Request, Response } from "express";
import Subscription from "../models/subscriptions.model";
import { upload, uploadImageOnly } from "../config/multer";
import jwt from "jsonwebtoken";

export const createSubscription = [
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "pdf", maxCount: 4 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized , No token provided"
        });
      }
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string,
        email: string
      };
      const userId = decodedToken.id;

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

      const photo = files?.photo?.[0]?.path || null;
      const pdf = files?.pdf?.map(file => file.path) || [];

      const newSubscription = new Subscription({
        user: userId,
        subscription_name,
        subscription_ctg,
        subscription_desc,
        subscription_start,
        subscription_end,
        subscription_billing_cycle,
        subscription_price,
        subscription_reminder,
        photo,
        pdf: pdf
      });
      console.log("Newww subscription", newSubscription);

      await newSubscription.save();
      res.status(200).json({
        success: true,
        message: "Subscription created successfully",
        subscription: newSubscription
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating subscription"
      });
    }
  }
];

export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
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
    const userSubscription = await Subscription.find({ user: userId });
    res.status(200).json({
      success: true,
      message: "Subscriptions fetched successfully",
      subscriptions: userSubscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteSubscription = [
  async (req: Request, res: Response) => {
    try {
      const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
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
      const subscription = Subscription.findOne({ _id: subscriptionId, user: userId });
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
        error: (error as Error).message,
      });
    }
  }
]

export const updateSubscription = [
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "pdf", maxCount: 4 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized, No token provided"
        });
      }
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const userId = decodedToken.id;
      const subscriptionId = req.params.id;

      const subscription = await Subscription.findOne({ _id: subscriptionId, user: userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found /  not authorized to delete",
        });
      }
      const { subscription_name,
        subscription_ctg,
        subscription_desc,
        subscription_start,
        subscription_end,
        subscription_billing_cycle,
        subscription_price,
        subscription_reminder } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const photo = files?.photo?.[0]?.path || subscription.photo;
      const pdf = files?.pdf?.map(file => file.path) || subscription.pdf;

      subscription.subscription_name = subscription_name || subscription.subscription_name;
      subscription.subscription_ctg = subscription_ctg || subscription.subscription_ctg;
      subscription.subscription_desc = subscription_desc || subscription.subscription_desc;
      subscription.subscription_start = subscription_start || subscription.subscription_start;
      subscription.subscription_end = subscription_end || subscription.subscription_end;
      subscription.subscription_billing_cycle = subscription_billing_cycle || subscription.subscription_billing_cycle;
      subscription.subscription_price = subscription_price || subscription.subscription_price;
      subscription.subscription_reminder = subscription_reminder || subscription.subscription_reminder;
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
        message: "Internal server error",
      });
    }
  }
];