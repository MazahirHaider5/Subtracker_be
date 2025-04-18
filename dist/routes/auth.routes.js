"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const googleAuth_controller_1 = require("../controllers/googleAuth.controller");
const jwt_1 = require("../utils/jwt");
const appleAuth_controller_1 = require("../controllers/appleAuth.controller");
const router = express_1.default.Router();
router.post("/signup", auth_controller_1.signup);
router.post("/verifyOtp", auth_controller_1.verifySignupOtp);
router.post("/login", auth_controller_1.login);
router.post("/logout", auth_controller_1.logout);
router.post("/social-login", auth_controller_1.socialLogin);
router.post("/requestOtp", auth_controller_1.requestOtp);
router.post("/resendOtp", auth_controller_1.resendOtp);
router.post("/verifyOtp", auth_controller_1.verifyOtp);
router.post("/resetPassword", auth_controller_1.resetPassword);
router.get("/google", googleAuth_controller_1.loginWithGoogle);
router.get("/google/callback", googleAuth_controller_1.googleCallback);
router.get("/apple", appleAuth_controller_1.loginWithApple);
router.post("/apple/callback", appleAuth_controller_1.appleCallback);
router.get("/protected", jwt_1.verifyAccessToken, (req, res) => {
    res.json({
        success: true,
        message: "You have access to this route!",
        user: req.user
    });
});
exports.default = router;
