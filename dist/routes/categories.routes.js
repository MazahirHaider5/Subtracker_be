"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const categories_controller_1 = require("../controllers/categories.controller");
const multer_1 = require("../config/multer");
const router = (0, express_1.Router)();
router.post("/createCategory", authenticate_1.verifyToken, multer_1.uploadImageOnly.single('image'), categories_controller_1.createCategory);
router.get("/getLoggedInUserCategories", authenticate_1.verifyToken, categories_controller_1.getLoggedInUserCategories);
router.get("/getCategoriesSum", authenticate_1.verifyToken, categories_controller_1.getCategoriesSum);
router.delete("/deleteCategory/:id", authenticate_1.verifyToken, categories_controller_1.deleteCategory);
router.patch("/updateCategory/:id", authenticate_1.verifyToken, categories_controller_1.updateCategory);
router.get("/getAllCategories", authenticate_1.verifyToken, categories_controller_1.getAllCategories);
exports.default = router;
