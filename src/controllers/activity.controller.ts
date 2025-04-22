import Activity from "../models/activity.model";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/users.model";

export const getAllActivities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const activities = await Activity.find().populate({
      path: "userId",
      select: "email"
    });
    res.status(200).json({ success: true, activities });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching activities" });
  }
};

export const getLoggedInUserActivities = async (
  req: Request,
  res: Response
) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not provided"
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const userId = decodedToken.id;

    // Get all activities for the user
    const allActivities = await Activity.find({ userId }).sort({ createdAt: -1 });

    const unreadActivities = allActivities.filter(activity => !activity.isRead);
    const readActivities = allActivities.filter(activity => activity.isRead);

    const totalCount = allActivities.length;
    const unreadCount = unreadActivities.length;
    const readCount = readActivities.length;

    res.status(200).json({
      success: true,
      message: "Activities fetched successfully",
      totalCount,
      unreadCount,
      readCount,
      unreadActivities,
      readActivities
    });

  } catch (error) {
    console.error("Error fetching user activities:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching activities"
    });
  }
};

export const markActivityAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const { activityId } = req.params;
    console.log("This is activity Id",activityId);
    
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized , token not provided"
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const activity = await Activity.findOneAndUpdate(
      { _id: activityId, userId },
      { isRead: true },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity marked as read",
      activity
    });
  } catch (error) {
    console.error("Error marking activity as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating activity"
    });
  }
};