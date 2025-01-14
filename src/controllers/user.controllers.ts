import { Request, Response } from "express";
import User, { IUser } from "../models/users.model";
import { hashPassword, comparePassword } from "../utils/bcrytp";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { sendMail } from "../utils/sendMail";
import { uploadImageOnly } from "../config/multer";
import jwt from "jsonwebtoken";

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
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, data: user });
    }
    const users = await User.find().select("-password");
    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Generate a 4-digit OTP
    const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Create a new user with is_verified set to false
    const newUser = new User({
      email,
      name: req.body.name || "Subtracker User",
      password: hashedPassword,
      user_type: "",
      otp: generatedOTP,
      otp_expiry: new Date(Date.now() + 90 * 1000), // 90 seconds expiry
      is_verified: false
    });
    await newUser.save();

    const subject = "Subtrack Email Verification Mail";
    const body = `Your OTP is ${generatedOTP}. It will expire in 90 seconds.`;
    await sendMail(email, subject, body);

    return res.status(201).json({
      success: true,
      message:
        "User created successfully. Please verify your OTP to complete registration."
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while creating the user",
      error: (error as Error).message
    });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, no token provided",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const userId = decodedToken.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting the account",
      error: (error as Error).message,
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
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    if (user.otp_expiry && new Date() > user.otp_expiry) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    user.is_verified = true;
    user.otp = null;
    user.otp_expiry = null;

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
        error: (error as Error).message
      });
    }
  }
];

export const changeLanguage = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. token not provided"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const { language } = req.body;
    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Language is required"
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { language },
      { new: true }
    );
    if (!updateUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Language updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating language",
    });
  }
};

export const changeCurrency = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. token not provided"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const { currency } = req.body;
    if (!currency) {
      return res.status(400).json({
        success: false,
        message: "Currency is required"
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { currency },
      { new: true }
    );
    if (!updateUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Currency updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating currency",
    });
  }
};
