import { Request, Response } from "express";
import Subscription from "../models/subscriptions.model";
import {upload, uploadImageOnly} from "../config/multer";
import path from "path";
import jwt from "jsonwebtoken";

export const createSubscription = [
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "pdf", maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
        const token = req.cookies.accessToken;
        if(!token){
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
      const pdf = files?.pdf?.[0]?.path || null;

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
        pdf
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
        const token = req.cookies.accessToken;
        if(!token) {
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
        const userSubscription = await Subscription.find({user: userId});
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
      const token = req.cookies.accessToken;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized, no token provided"
        });
      }
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
      };
      const userId = decodedToken.id;
      const subscriptionId = req.params.id;
      const subscription = Subscription.findOne({_id: subscriptionId, user: userId});
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
        message: "Internal server error"
      });
    }
  }
]