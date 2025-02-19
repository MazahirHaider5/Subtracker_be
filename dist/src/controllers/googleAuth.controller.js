"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = exports.loginWithGoogle = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const users_model_1 = __importDefault(require("../models/users.model"));
const jwt_1 = require("../utils/jwt");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let user = yield users_model_1.default.findOne({ email: (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0].value });
        if (!user) {
            user = new users_model_1.default({
                googleId: profile.id,
                email: (_b = profile.emails) === null || _b === void 0 ? void 0 : _b[0].value,
                name: profile.displayName || "Anonymous User",
                photo: ((_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0].value) || "",
                user_type: "individual",
                is_verified: true
            });
            yield user.save();
        }
        const newAccessToken = (0, jwt_1.generateAccessToken)(user);
        done(null, {
            user,
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        done(error, false);
    }
})));
exports.loginWithGoogle = passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
    session: false
});
const googleCallback = (req, res, next) => {
    passport_1.default.authenticate("google", { session: false }, (err, data, info) => {
        if (err) {
            console.error("Google OAuth Error:", err);
            return res.status(500).json({
                success: false,
                message: "Authentication failed due to an internal error."
            });
        }
        if (!data) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed. No user data returned."
            });
        }
        const { user, accessToken } = data;
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
        });
        res.redirect(`${process.env.FRONT_END_SUCCESS_URL}`);
        // Send response with tokens
    })(req, res, next);
};
exports.googleCallback = googleCallback;
//
