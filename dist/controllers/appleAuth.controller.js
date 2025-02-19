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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.appleCallback = exports.loginWithApple = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_apple_1 = __importDefault(require("passport-apple"));
const users_model_1 = __importDefault(require("../models/users.model"));
passport_1.default.use(new passport_apple_1.default({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyString: (_a = process.env.APPLE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"),
    callbackURL: process.env.APPLE_REDIRECT_URI,
    passReqToCallback: true
}, (req, accessToken, refreshToken, idToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const email = profile.email || (idToken === null || idToken === void 0 ? void 0 : idToken.email) || ((_a = idToken === null || idToken === void 0 ? void 0 : idToken.payload) === null || _a === void 0 ? void 0 : _a.email);
        const name = profile.name || "Apple user";
        console.log("✅ ID Token:", idToken);
        console.info("Apple Login Profile:", profile);
        console.warn("Extracted Email:", email);
        console.info("Extracted Name:", name);
        let user = yield users_model_1.default.findOne({ email });
        if (!user) {
            console.log("creating new user....");
            user = new users_model_1.default({
                appleId: idToken === null || idToken === void 0 ? void 0 : idToken.sub,
                email,
                is_verified: true,
                user_type: "basic"
            });
            console.log("User Data Before Save:", user);
            try {
                const savedUser = yield user.save();
                console.log("User successfully saved to database:", savedUser);
            }
            catch (err) {
                console.log("Error saving user to database:", err);
            }
        }
        else {
            console.log("User found in database:", user);
        }
        done(null, user);
    }
    catch (error) {
        console.error("Error during Apple strategy authentication:", error);
        done(error, false);
    }
})));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_model_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
}));
// Route to start Apple login
exports.loginWithApple = passport_1.default.authenticate("apple", {
    scope: ["email", "name"]
});
// Apple callback route
const appleCallback = (req, res) => {
    console.log("✅ Apple Callback Hit");
    console.log("User from session:", req.user);
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed. No user data returned.",
        });
    }
    res.status(200).json({
        success: true,
        message: "Login Successful",
        user: req.user,
    });
};
exports.appleCallback = appleCallback;
