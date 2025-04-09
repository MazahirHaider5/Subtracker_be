import { Request, Response } from "express";
import Category from "../models/categories.model";
import jwt from "jsonwebtoken";

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
    };
    const userId = decodedToken.id;
    const { category_name, category_desc, category_budget, category_image } = req.body;
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
      category_desc: category_desc || "",
      category_budget,
      category_image: category_image || "",
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

export const getCategories = async (req: Request, res: Response) => {
  try {
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized, token required"
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };
    const userId = decodedToken.id;
    const categories = await Category.find({ user: userId })
      .populate("subscriptions")
      .lean()
      .exec();
      
      const updatedCategories = categories.map(category => {
        const activeSubscriptions = category.subscriptions.filter(
          (sub) => sub.is_paid === true
        ).length;
        const monthlyDataArray = Object.entries(category.monthly_data || {}).map(
          ([date, data]: [string, any]) => ({
            date,
            total_spent: data.total_spent,
            subscriptions: data.subscriptions
          })
        );
        return {
          ...category,
          active_subscriptions: activeSubscriptions,
          monthly_data: monthlyDataArray
        };
      });
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories: updatedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories"
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
    };
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
    };
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

//