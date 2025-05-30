import { Request, Response } from "express";
import User from "../models/users.model";
import Activity from "../models/activity.model";
import { hashPassword, comparePassword } from "../utils/bcrytp";
import { uploadImageOnly } from "../config/multer";
import jwt from "jsonwebtoken";

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
        title: "profile updated",
        activityType: "profile updated successfuly",
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
      is_face_auth,
      is_two_factor,
      is_email_notification,
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
    if (typeof is_face_auth == "boolean")
      updateFields.is_face_auth = is_face_auth;

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

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }
  try {
    const token = req.cookies.accessToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not provided"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decodedToken.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Password not set for this user"
      });
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }
    
    const newHashedPassword = await hashPassword(newPassword);
    user.password = newHashedPassword;
    await user.save();

    await Activity.create({
      userId,
      title: "Password changed",
      activityType: "Password changed successfully",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while changing the password",
      error: (error as Error).message
    });
  }
};