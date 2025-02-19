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
exports.getDashboardData = void 0;
const subscriptions_model_1 = __importDefault(require("../models/subscriptions.model"));
const categories_model_1 = __importDefault(require("../models/categories.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getDashboardData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const subscriptions = yield subscriptions_model_1.default.find({ user: userId });
        const categories = yield categories_model_1.default.find({ user: userId });
        const totalSubscriptions = subscriptions.length;
        const dueSubscriptions = subscriptions.filter((sub) => new Date(sub.subscription_end) < new Date()).length;
        const paidSubscription = subscriptions.filter((sub) => sub.is_paid).length;
        const totalSpendings = subscriptions.reduceRight((sum, sub) => sum + sub.subscription_price, 0);
        const graphData = [];
        categories.forEach((category) => {
            const month = new Date(category.createdAt).toLocaleString("default", { month: "short" });
            const existingCategory = graphData.find(item => item.category_name === category.category_name);
            if (existingCategory) {
                existingCategory.data.push({
                    date: month,
                    spendings: category.spendings
                });
            }
            else {
                graphData.push({
                    category_name: category.category_name,
                    data: [{
                            date: month,
                            spendings: category.spendings
                        }]
                });
            }
        });
        const upcomingRenewals = subscriptions.filter((sub) => {
            const currentDate = new Date();
            const subscriptionEndDate = new Date(sub.subscription_end);
            const timeDifference = subscriptionEndDate.getTime() - currentDate.getTime();
            const daysRemaining = timeDifference / (1000 * 3600 * 24);
            return daysRemaining <= 7 && daysRemaining > 0;
        }).map((sub) => ({
            subscription_name: sub.subscription_name,
            subscription_price: sub.subscription_price,
            subscription_end: sub.subscription_end
        }));
        res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: {
                totalSubscriptions,
                dueSubscriptions,
                paidSubscription,
                totalSpendings,
                graphData,
                upcomingRenewals
            }
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
exports.getDashboardData = getDashboardData;
