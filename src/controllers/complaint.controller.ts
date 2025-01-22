import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Complaint from "../models/complaints.model";

export const createComplaint = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, No token provided",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decodedToken.id;

    const { issue, subject, description } = req.body;

    if (!issue || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newComplaint = new Complaint({
      user_id: userId,
      issue,
      subject,
      description,
    });

    const savedComplaint = await newComplaint.save();

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint: savedComplaint,
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
