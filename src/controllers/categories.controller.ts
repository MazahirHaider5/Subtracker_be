import {Request, Response} from "express";
import Category from "../models/categories.model";
import jwt from "jsonwebtoken";

export const createCategory = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.accessToken;
        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, no token provided"
            });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};
        const userId = decodedToken.id;

        const {category_name, category_desc, category_budget} = req.body;
        if (!category_name || !category_budget) {
            return res.status(400).json({
                success: false,
                message: "Category name and budget required"
            });
        }
        const newCategory = new Category({
            user: userId,
            category_name,
            category_desc: category_desc || "",
            category_budget,
        });
        await newCategory.save(),
        res.status(200).json({
            success: true,
            message: "Category created successfully",
            category: newCategory
        });
    } catch (error) {
        res.status(500).json({
            success: true,
            message: "Error occured while creating Category",
        });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token required",
            });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string,
            email: string
        };
        const userId = decodedToken.id;
        const categories = await Category.find({ user: userId});
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching categories"
        })
    }
}

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token missing"
            });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string
        };
        const userId = decodedToken.id;
        const categoryId = req.params.id;
        const category = await Category.findOne({_id: categoryId, user: userId});
        if(!category){
            return res.status(404).json({
                success: false,
                message: "Category not found or you are not authorized to delete this category",
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
}

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token not found"
            });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {id: string};
        const userId = decodedToken.id;
        
        const {category_name, category_desc, category_budget} = req.body;
        const categoryId = req.params.id;

        if(!category_name && !category_budget && !category_desc) {
            return res.status(400).json({
                success: false,
                message: "Fields missing , updating anyone field is needed to update"
            });
        }
        const category = await Category.findOne({ _id: categoryId, user: userId });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found or you are not authorized to update this category"
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
            error: (error as Error).message,
        })
    }
}