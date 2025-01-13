import { Request, Response } from "express";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback
} from "passport-google-oauth20";
import User from "../models/users.model";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "https://subtracker-be.onrender.com/auth/google/callback"
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      
      try {
        let user = await User.findOne({ email: profile.emails?.[0].value });
        if (!user) {
          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0].value,
            name: profile.displayName || "Anonymous User",
            photo: profile.photos?.[0].value || "",
            user_type: "individual",
            is_verified: true
          });
          await user.save();
        }
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        done(null, { user, accessToken: newAccessToken, refreshToken: newRefreshToken });
      } catch (error) {
        done(error, false);
      }
    }
  )
);

export const loginWithGoogle = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});


export const googleCallback = (req: Request, res: Response, next: any) => {
  passport.authenticate("google", { session: false }, (err, data, info) => {
    if (err) {
      console.error("Google OAuth Error:", err);
      return res.status(500).json({
        success: false,
        message: "Authentication failed due to an internal error.",
      });
    }
    if (!data) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. No user data returned.",
      });
    }

    const { user, accessToken, refreshToken } = data;

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });


    // Send response with tokens
    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
      accessToken,
      refreshToken,
    });
  })(req, res, next);
};

