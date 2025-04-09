import { Request, Response } from "express";
import User, { IUser } from "../models/users.model";
import Activity from "../models/activity.model";
import { hashPassword } from "../utils/bcrytp";
import { sendMail } from "../utils/sendMail";
import { uploadImageOnly } from "../config/multer";
import jwt from "jsonwebtoken";
import validator from "validator";

export const getUsers = async (req: Request, res: Response) => {
  const { id, email, user_type } = req.query;
  try {
    if (user_type && !["enterprise", "admin"].includes(user_type as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role provided"
      });
    }
    if (id || email) {
      const user = await User.findOne({
        $or: [{ _id: id }, { email: email }],
        ...(user_type && { user_type })
      }).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, data: user });
    }

    const query: any = {};
    if (user_type) query.user_type = user_type;

    const users = await User.find(query).select("-password");

    if (!users.length) {
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

export const userSignup = async (req: Request, res: Response) => {
  const { email, password, userName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const hashedPassword = await hashPassword(password);
    const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    const user = await User.create({
      email,
      name: userName || "Subtracker User",
      password: hashedPassword,
      phone: "",
      photo: "https://ui-avatars.com/api/?name=Subtracker+User&background=random",
      otp: generatedOTP,
      otp_expiry: new Date(Date.now() + 90 * 1000),
      signup_date: new Date(),
      is_verified: false
    });

    const subject = "Subtrack Email Verification Mail";
    const body = `Your OTP is ${generatedOTP}. It will expire in 90 seconds.`;
    await sendMail(email, subject, body);

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete registration."
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
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting the account",
      error: (error as Error).message
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
    const user: IUser | null = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ success: false, message: "user not fou" });
    }

    if (user?.otp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    if (
      user?.otp_expiry &&
      new Date(user.otp_expiry) instanceof Date &&
      new Date() > new Date(user.otp_expiry)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "otp is expired" });
    }
    user.is_verified = true;
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
      await Activity.create({
        userId: user._id,
        activityType: "profile updated"
      });
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
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
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
      message: "Error updating language"
    });
  }
};

export const changeCurrency = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
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
      message: "Error updating currency"
    });
  }
};

// for updating is_biomatric, is_two_factor , is_email_notification, currency, language,
// using a single controller when user can update a single or multiple fields using params
export const updateSpecificFields = async (req: Request, res: Response) => {
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

    const {
      language,
      currency,
      is_biomatric,
      is_two_factor,
      is_email_notification
    } = req.body;
    const updateFields: {
      [key: string]: any;
    } = {};

    if (language) updateFields.language = language;
    if (currency) updateFields.currency = currency;
    if (typeof is_biomatric == "boolean")
      updateFields.is_biomatric = is_biomatric;
    if (typeof is_two_factor == "boolean")
      updateFields.is_two_factor = is_two_factor;
    if (typeof is_email_notification == "boolean")
      updateFields.is_email_notification = is_email_notification;

    if (Object.keys(updateFields).length == 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update"
      });
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating user fields"
    });
  }
};

export const setPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user doesnot exits" });
    }
    if (user.password?.length == 0) {
      return res
        .status(400)
        .json({ success: false, message: "Enter invited email" });
    }
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.is_verified = true;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "password set succesfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, no token provided"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};
    const userId = decodedToken.id;
    const user = await User.findById(userId).select("-password -otp -otp_expiry -reset_token -reset_token_expiry");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    return res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching user details",
      error: (error as Error).message
    });
  }
};    