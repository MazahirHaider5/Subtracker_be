"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const router = (0, express_1.Router)();
router.get("/getAllActivities", activity_controller_1.getAllActivities);
exports.default = router;
