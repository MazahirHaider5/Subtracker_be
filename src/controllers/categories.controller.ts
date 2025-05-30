import { Request, Response } from "express";
import Category from "../models/categories.model";
import jwt from "jsonwebtoken";
import subscriptionsModel from "../models/subscriptions.model";

export const createCategory = async (req: Request, res: Response) => {
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
      user_type?: string;
    };
    // Check if user is admin
    if (decodedToken.user_type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin users can create categories"
      });
    }
    
    const userId = decodedToken.id;

    const { category_name, category_desc, category_budget } = req.body;
    const files = req.file;
    const category_image = files?.path || "";

    console.log("Request Body:", req.body);
    console.log("Uploaded File:", files);

    if (!category_name || !category_budget) {
      return res.status(400).json({
        success: false,
        message: "Category name and budget required"
      });
    }

    const existingCategory = await Category.findOne({
      user: userId,
      category_name: { $regex: new RegExp(`^${category_name}$`, 'i') }
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "You already have a category with this name, please use a different name"
      });
    }

    const newCategory = new Category({
      user: userId,
      category_name,
      category_desc: category_desc ?? "",
      category_budget,
      category_image,
      monthly_data: {}
    });
    await newCategory.save();
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: newCategory
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getLoggedInUserCategories = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };
    const userId = decodedToken.id;

    // Step 1: Get all subscriptions of the user
    const userSubscriptions = await subscriptionsModel.find({ user: userId }).lean();

    // Step 2: Group subscriptions by category
    const categoryMap = new Map<string, any[]>();
    let totalSpent = 0;

    userSubscriptions.forEach((sub) => {
      const ctgId = sub.subscription_ctg.toString();
      if (!categoryMap.has(ctgId)) {
        categoryMap.set(ctgId, []);
      }
      categoryMap.get(ctgId)!.push(sub);
      totalSpent += sub.subscription_price || 0;
    });

    // Step 3: Fetch matching categories from categoryMap keys
    const categoryIds = Array.from(categoryMap.keys());
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();

    const result = categories.map((category) => {
      const subs = categoryMap.get(category._id.toString()) || [];
      const categoryTotal = subs.reduce((sum, sub) => sum + (sub.subscription_price || 0), 0);

      return {
        category_id: category._id,
        category_name: category.category_name,
        category_desc: category.category_desc,
        category_image: category.category_image,
        total_subscriptions: subs.length,
        total_subscription_cost: categoryTotal,
        subscriptions: subs.map((sub) => ({
          subscription_name: sub.subscription_name,
          subscription_price: sub.subscription_price,
        })),
      };
    });

    res.status(200).json({
      success: true,
      message: "Categories and subscriptions fetched successfully",
      total_spent: totalSpent,
      categories: result,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token missing"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      user_type?: string
    };
    // Check if user is admin
    if (decodedToken.user_type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin users can create categories"
      });
    }
    const userId = decodedToken.id;
    const categoryId = req.params.id;
    const category = await Category.findOne({ _id: categoryId, user: userId });
    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found or you are not authorized to delete this category"
      });
    }
    await Category.findByIdAndDelete(categoryId);
    res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not found"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      user_type?: string;
    };
        // Check if user is admin
        if (decodedToken.user_type !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Access denied. Only admin users can create categories"
          });
        }

    const userId = decodedToken.id;

    const { category_name, category_desc, category_budget } = req.body;
    const categoryId = req.params.id;

    if (!category_name && !category_budget && !category_desc) {
      return res.status(400).json({
        success: false,
        message: "Fields missing , updating anyone field is needed to update"
      });
    }
    const category = await Category.findOne({ _id: categoryId, user: userId });

    if (!category) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found or you are not authorized to update this category"
      });
    }
    category.category_name = category_name || category.category_name;
    category.category_desc = category_desc || category.category_desc;
    category.category_budget = category_budget || category.category_budget;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: category
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
  }
};

export const getCategoriesSum = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token not found"
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    const userId = decodedToken.id;

    const categories = await Category.find({ user: userId });

    let categoryBudget = 0;
    let totalSpendings = 0;

    categories.forEach((category) => {
      console.log(`Category: ${category.category_name}`);
      console.log(`Total Budget: ${category.total_budget}`);
      console.log(`Spendings: ${category.spendings}`);

      categoryBudget += category.category_budget;
      totalSpendings += category.spendings;
    });
    res.status(200).json({
      success: true,
      message: "Categories data fetched successfully",
      total_budget: categoryBudget,
      total_spendings: totalSpendings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching sum, internal server error"
    });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().select("category_name category_image category_budget total_budget active_subscriptions spendings monthly_data createdAt user")
    res.status(200).json({
      success: true,
      message: "All categories fetched successfully",
      categories
    });

  } catch (error) {
    console.error("Error fetching all categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: (error as Error).message
    });
  }
};
