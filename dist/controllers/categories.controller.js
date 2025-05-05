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
exports.getAllCategories = exports.getCategoriesSum = exports.updateCategory = exports.deleteCategory = exports.getLoggedInUserCategories = exports.createCategory = void 0;
const categories_model_1 = __importDefault(require("../models/categories.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const subscriptions_model_1 = __importDefault(require("../models/subscriptions.model"));
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
const getLoggedInUserCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.accessToken ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized, token required",
            });
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
        // Step 1: Get all subscriptions of the user
        const userSubscriptions = yield subscriptions_model_1.default.find({ user: userId }).lean();
        // Step 2: Group subscriptions by category
        const categoryMap = new Map();
        let totalSpent = 0;
        userSubscriptions.forEach((sub) => {
            const ctgId = sub.subscription_ctg.toString();
            if (!categoryMap.has(ctgId)) {
                categoryMap.set(ctgId, []);
            }
            categoryMap.get(ctgId).push(sub);
            totalSpent += sub.subscription_price || 0;
        });
        // Step 3: Fetch matching categories from categoryMap keys
        const categoryIds = Array.from(categoryMap.keys());
        const categories = yield categories_model_1.default.find({ _id: { $in: categoryIds } }).lean();
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
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
        });
    }
});
exports.getLoggedInUserCategories = getLoggedInUserCategories;
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
        // Check if user is admin
        if (decodedToken.user_type !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only admin users can create categories"
            });
        }
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
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield categories_model_1.default.find().select("category_name category_image category_budget total_budget active_subscriptions spendings monthly_data createdAt user");
        res.status(200).json({
            success: true,
            message: "All categories fetched successfully",
            categories
        });
    }
    catch (error) {
        console.error("Error fetching all categories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message
        });
    }
});
exports.getAllCategories = getAllCategories;
