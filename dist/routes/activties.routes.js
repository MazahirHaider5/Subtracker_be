"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const authenticate_1 = require("../middleware/authenticate");
const router = (0, express_1.Router)();
router.get("/getAllActivities", activity_controller_1.getAllActivities);
router.get("/getLoggedInUserActivities", authenticate_1.verifyToken, activity_controller_1.getLoggedInUserActivities);
router.post("/markActivityAsRead/:activityId", authenticate_1.verifyToken, activity_controller_1.markActivityAsRead);
exports.default = router;
