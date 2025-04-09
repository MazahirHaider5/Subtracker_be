import { Request, Response } from "express";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback
} from "passport-google-oauth20";
import User from "../models/users.model";
import { generateAccessToken } from "../utils/jwt";

const callbackURL = process.env.NODE_ENV === "production" 
  ? `${process.env.BACKEND_URL}/auth/google/callback`
  : "http://localhost:3000/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        let user = await User.findOne({ email: profile.emails?.[0].value });
        if (!user) {
          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0].value,
            name: profile.displayName || "Anonymous User",
            photo: profile.photos?.[0].value || "",
            user_type: "enterprise",
            is_verified: true,
            signup_date: new Date(),
            last_login: new Date()
          });
          await user.save();
        } else {
          user.last_login = new Date();
          await user.save();
        }
        const newAccessToken = generateAccessToken(user);
        done(null, {
          user,
          accessToken: newAccessToken,
        });
      } catch (error) {
        done(error, false);
      }
    }
  )
);

export const loginWithGoogle = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false
});

export const googleCallback = (req: Request, res: Response, next: any) => {
  passport.authenticate("google", { session: false }, (err, data, info) => {
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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Send response with user data and token
    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user,
      accessToken
    });
  })(req, res, next);
};

//
