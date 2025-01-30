import Activity from "../models/activity.model";
import { Request, Response } from "express";

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
