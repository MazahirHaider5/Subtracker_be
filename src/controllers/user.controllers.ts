import { Request, Response } from "express";
import User, { IUser } from "../models/users.model";
import { hashPassword, comparePassword } from "../utils/bcrytp";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { sendMail } from "../utils/sendMail";
import { uploadImageOnly } from "../config/multer";
import jwt  from "jsonwebtoken";
// Helper function to get user by ID or email
const findUser = async (id: string | undefined, email?: string) => {
  let user;
  if (id) {
    user = await User.findById(id);
  } else if (email) {
    user = await User.findOne({ email });
  }
  return user;
};

// Get all users or a single user by query parameters
export const getUsers = async (req: Request, res: Response) => {
  const { id, email } = req.query;
  try {
    if (id || email) {
      const user = await findUser(id as string, email as string);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, data: user });
    }
    const users = await User.find().select("-password");
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while fetching users",
      error: (error as Error).message
    });
  }
};

// Create a new user
export const createUser = async (req: Request, res: Response) => {
  const { email, name, password, user_type } = req.body;
  if (!email || !name || !password || !user_type) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User with this email already exists" });
    }
    const hashedPassword = await hashPassword(password);
    const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      user_type,
      otp: generatedOTP, 
      otp_expiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    });
    await newUser.save();
    const subject="Subtrack Email Verification Mail"
    const body=`your otp is ${generatedOTP}`;
    await sendMail(email,subject,body);
    return res.status(201).json({ success: true, message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while creating the user",
      error: (error as Error).message
    });
  }
};

export const updateUser = [
  uploadImageOnly.single("photo"),
  async (req: Request, res: Response) => {
    try {
      const token =
        req.cookies.accessToken || req.headers.authorization?.split("")[1];
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
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }
      const { email, name, phone } = req.body;
      if (email) user.email = email;
      if (name) user.name = name;
      if (phone) user.phone = phone;

      if (req.file) {
        user.photo = req.file.path;
      }
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Updated successfully",
        user
      });
    } catch (error) {
      console.error("Error updating user", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }
];
