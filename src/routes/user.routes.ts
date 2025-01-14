import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import {
  changeCurrency,
  changeLanguage,
  deleteAccount,
  getUsers,
  updateUser,
} from "../controllers/user.controllers";

const router = Router();

router.get("/allUsers",verifyToken, getUsers);
router.patch("/updateUser", verifyToken, updateUser);

router.patch("/changeLanguage",verifyToken, changeLanguage);
router.patch("/changeCurrency",verifyToken, changeCurrency);

router.delete("/deleteAccount",verifyToken, deleteAccount);


export default router;
