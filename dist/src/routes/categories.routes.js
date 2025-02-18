"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const categories_controller_1 = require("../controllers/categories.controller");
const router = (0, express_1.Router)();
router.post("/createCategory", authenticate_1.verifyToken, categories_controller_1.createCategory);
router.get("/getCategories", authenticate_1.verifyToken, categories_controller_1.getCategories);
router.get("/getCategoriesSum", authenticate_1.verifyToken, categories_controller_1.getCategoriesSum);
router.delete("/deleteCategory/:id", authenticate_1.verifyToken, categories_controller_1.deleteCategory);
router.patch("/updateCategory/:id", authenticate_1.verifyToken, categories_controller_1.updateCategory);
exports.default = router;
