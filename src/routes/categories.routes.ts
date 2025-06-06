import {Router} from "express";
import { verifyToken } from "../middleware/authenticate";
import { createCategory, deleteCategory, getAllCategories, getLoggedInUserCategories, getCategoriesSum, updateCategory } from "../controllers/categories.controller";
import { uploadImageOnly } from "../config/multer";



const router = Router();

router.post("/createCategory", verifyToken, uploadImageOnly.single('image'), createCategory);
router.get("/getLoggedInUserCategories", verifyToken, getLoggedInUserCategories);
router.get("/getCategoriesSum", verifyToken, getCategoriesSum);
router.delete("/deleteCategory/:id", verifyToken, deleteCategory);
router.patch("/updateCategory/:id",verifyToken, updateCategory);
router.get("/getAllCategories",verifyToken, getAllCategories);

export default router;