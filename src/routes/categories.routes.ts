import {Router} from "express";
import { verifyToken } from "../middleware/authenticate";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../controllers/categories.controller";



const router = Router();

router.post("/createCategory",verifyToken, createCategory);
router.get("/getCategories", verifyToken, getCategories);
router.delete("/deleteCategory/:id", verifyToken, deleteCategory);
router.patch("/updateCategory/:id",verifyToken, updateCategory);

export default router;