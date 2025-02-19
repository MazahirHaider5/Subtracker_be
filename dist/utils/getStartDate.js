"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStartDate = void 0;
const getStartDate = (timeframe) => {
    let startDate = new Date();
    if (timeframe === "weekly") {
        startDate.setDate(startDate.getDate() - 7); // Get last 7 days
    }
    else if (timeframe === "monthly") {
        startDate.setMonth(startDate.getMonth() - 12); // Get last 12 months
    }
    else if (timeframe === "yearly") {
        startDate.setFullYear(startDate.getFullYear() - 5); // Get last 5 years
    }
    return startDate;
};
exports.getStartDate = getStartDate;
