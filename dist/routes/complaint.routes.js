"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const complaint_controller_1 = require("../controllers/complaint.controller");
const router = (0, express_1.Router)();
router.post("/createComplaint", authenticate_1.verifyToken, complaint_controller_1.createComplaint);
router.get("/getComplaints", complaint_controller_1.getUserComplaints);
exports.default = router;
