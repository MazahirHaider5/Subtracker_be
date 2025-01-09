import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import {
  getUsers,
  updateUser,
} from "../controllers/user.controllers";

const router = Router();

router.get("/allUsers",verifyToken, getUsers);
router.patch("/updateUser", verifyToken, updateUser);

export default router;
