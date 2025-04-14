import express from "express";
import {
  login,
  logout,
  requestOtp,
  resendOtp,
  resetPassword,
  socialLogin,
  verifyOtp
} from "../controllers/auth.controller";
import {
  googleCallback,
  loginWithGoogle
} from "../controllers/googleAuth.controller";
import { verifyAccessToken } from "../utils/jwt";
import { verifySignupOtp } from "../controllers/user.controllers";
import {
  appleCallback,
  loginWithApple
} from "../controllers/appleAuth.controller";

const router = express.Router();

router.post("/verifyOtp", verifySignupOtp);

router.post("/login", login);
router.post("/logout", logout);

router.post("/social-login", socialLogin);


router.post("/requestOtp", requestOtp);
router.post("/resendOtp", resendOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);

router.get("/google", loginWithGoogle);
router.get("/google/callback", googleCallback);

router.get("/apple", loginWithApple);
router.post("/apple/callback", appleCallback);


router.get("/protected", verifyAccessToken, (req, res) => {
  res.json({
    success: true,
    message: "You have access to this route!",
    user: req.user
  });
});

export default router;
