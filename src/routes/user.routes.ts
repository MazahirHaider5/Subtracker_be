import { Router } from "express";
import { verifyToken } from "../middleware/authenticate";
import {
  changeCurrency,
  changeLanguage,
  deleteAccount,
  getUsers,
  updateSpecificFields,
  updateUser,
  setPassword
} from "../controllers/user.controllers";

const router = Router();

router.get("/allUsers", getUsers);

router.patch("/updateUser", verifyToken, updateUser);

router.patch("/updateSpecificDetails", verifyToken, updateSpecificFields);
router.patch("/changeLanguage", verifyToken, changeLanguage);
router.patch("/changeCurrency", verifyToken, changeCurrency);
router.post("/setPassword", setPassword);

router.delete("/deleteAccount", verifyToken, deleteAccount);

export default router;
