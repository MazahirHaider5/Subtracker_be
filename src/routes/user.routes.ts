import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import {
  changeCurrency,
  changeLanguage,
  getUsers,
  updateUser,
} from "../controllers/user.controllers";

const router = Router();

router.get("/allUsers",verifyToken, getUsers);
router.patch("/updateUser", verifyToken, updateUser);

router.patch("/changeLanguage", changeLanguage);
router.patch("/changeCurrency", changeCurrency);


export default router;
