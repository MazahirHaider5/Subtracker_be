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
            subscription_ids: [],
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