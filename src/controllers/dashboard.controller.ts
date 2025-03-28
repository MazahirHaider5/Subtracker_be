import { Request, Response } from "express";
import Subscription from "../models/subscriptions.model";
import Categories from "../models/categories.model";
import jwt from "jsonwebtoken";

export const getDashboardData = async (req: Request, res: Response) => {
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
    const subscriptions = await Subscription.find({ user: userId });
    const categories = await Categories.find({ user: userId });
    const totalSubscriptions = subscriptions.length;
    const dueSubscriptions = subscriptions.filter(
      (sub) => new Date(sub.subscription_end) < new Date()
    ).length;
    const paidSubscription = subscriptions.filter((sub) => sub.is_paid).length;
    const totalSpendings = subscriptions.reduceRight(
      (sum, sub) => sum + sub.subscription_price,
      0
    );

    const graphData: { category_name: string; data: { date: string; spendings: number }[] }[] = [];

    categories.forEach((category) => {
      const month = new Date(category.createdAt).toLocaleString("default", { month: "short" });
      
      const existingCategory = graphData.find(item => item.category_name === category.category_name);
      if (existingCategory) {
        existingCategory.data.push({
          date: month,
          spendings: category.spendings
        });
      } else {
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message
    });
  }
};
