"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoriesSum = exports.updateCategory = exports.deleteCategory = exports.getCategories = exports.createCategory = void 0;
const categories_model_1 = __importDefault(require("../models/categories.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, no token provided"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { category_name, category_desc, category_budget } = req.body;
        const files = req.file;
        const category_image = (files === null || files === void 0 ? void 0 : files.path) || "";
        console.log("Request Body:", req.body);
        console.log("Uploaded File:", files);
        if (!category_name || !category_budget) {
            return res.status(400).json({
                success: false,
                message: "Category name and budget required"
            });
        }
        const existingCategory = yield categories_model_1.default.findOne({
            user: userId,
            category_name: { $regex: new RegExp(`^${category_name}$`, 'i') }
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "You already have a category with this name, please use a different name"
            });
        }
        const newCategory = new categories_model_1.default({
            user: userId,
            category_name,
            category_desc: category_desc !== null && category_desc !== void 0 ? category_desc : "",
            category_budget,
            category_image,
            monthly_data: {}
        });
        yield newCategory.save();
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category: newCategory
        });
    }
    catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});
exports.createCategory = createCategory;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token required"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const categories = yield categories_model_1.default.find({ user: userId })
            .populate("subscriptions")
            .lean()
            .exec();
        const updatedCategories = categories.map(category => {
            const activeSubscriptions = category.subscriptions.filter((sub) => sub.is_paid === true).length;
            const monthlyDataArray = Object.entries(category.monthly_data || {}).map(([date, data]) => ({
                date,
                total_spent: data.total_spent,
                subscriptions: data.subscriptions
            }));
            return Object.assign(Object.assign({}, category), { active_subscriptions: activeSubscriptions, monthly_data: monthlyDataArray });
        });
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            categories: updatedCategories
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching categories"
        });
    }
});
exports.getCategories = getCategories;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token missing"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const categoryId = req.params.id;
        const category = yield categories_model_1.default.findOne({ _id: categoryId, user: userId });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found or you are not authorized to delete this category"
            });
        }
        yield categories_model_1.default.findByIdAndDelete(categoryId);
        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
});
exports.deleteCategory = deleteCategory;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token not found"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const { category_name, category_desc, category_budget } = req.body;
        const categoryId = req.params.id;
        if (!category_name && !category_budget && !category_desc) {
            return res.status(400).json({
                success: false,
                message: "Fields missing , updating anyone field is needed to update"
            });
        }
        const category = yield categories_model_1.default.findOne({ _id: categoryId, user: userId });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found or you are not authorized to update this category"
            });
        }
        category.category_name = category_name || category.category_name;
        category.category_desc = category_desc || category.category_desc;
        category.category_budget = category_budget || category.category_budget;
        yield category.save();
        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: category
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});
exports.updateCategory = updateCategory;
const getCategoriesSum = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token not found"
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        const categories = yield categories_model_1.default.find({ user: userId });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching sum, internal server error"
        });
    }
});
exports.getCategoriesSum = getCategoriesSum;
//
