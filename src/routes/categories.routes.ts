import {Router} from "express";
import { verifyToken } from "../middleware/authenticate";
import { createCategory, getCategories } from "../controllers/categories.controller";



const router = Router();

router.post("/createCategory",verifyToken, createCategory);
router.get("/getCategories", verifyToken, getCategories);

export default router;