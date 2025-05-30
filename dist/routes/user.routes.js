"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const user_controllers_1 = require("../controllers/user.controllers");
const router = (0, express_1.Router)();
router.get("/allUsers", user_controllers_1.getUsers);
router.get("/getUserDetails", user_controllers_1.getUserDetails);
router.patch("/updateUser", authenticate_1.verifyToken, user_controllers_1.updateUser);
router.patch("/updateSpecificDetails", authenticate_1.verifyToken, user_controllers_1.updateSpecificFields);
router.patch("/changeLanguage", authenticate_1.verifyToken, user_controllers_1.changeLanguage);
router.patch("/changeCurrency", authenticate_1.verifyToken, user_controllers_1.changeCurrency);
router.post("/setPassword", user_controllers_1.setPassword);
router.delete("/deleteAccount", authenticate_1.verifyToken, user_controllers_1.deleteAccount);
router.post("/changePassword", user_controllers_1.changePassword);
exports.default = router;
