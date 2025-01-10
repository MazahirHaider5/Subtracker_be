import express from "express";
import {
    login,
    requestOtp,
    resendOtp,
    resetPassword,
    verifyOtp
} from "../controllers/auth.controller";
import {
    googleCallback,
    loginWithGoogle
} from "../controllers/googleAuth.controller";
import { verifyToken } from "../middleware/authenticate";
import { verifyAccessToken } from "../utils/jwt";
import { createUser, verifySignupOtp } from "../controllers/user.controllers";
import { appleCallback, loginWithApple } from "../controllers/appleAuth.controller";

const router = express.Router();

router.post("/signUp", createUser);
router.post("/verifyOtp", verifySignupOtp);

router.post("/login", login);

router.post("/requestOtp", requestOtp);
router.post("/resendOtp", resendOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);

router.get("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);

router.get("/apple", loginWithApple);
router.post("/apple/callback", appleCallback);

// router.post("/refresh-token", refreshAccessToken);

router.get("/protected", verifyAccessToken, (req, res) => {
    res.json({ success: true, message: "You have access to this route!", user: req.user });
  });

export default router;
