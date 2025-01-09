import { Request, Response } from "express";
import passport from "passport";
import AppleStrategy from "passport-apple";
import User from "../models/users.model";
import fs from "fs";

passport.use(
  new AppleStrategy(
    {
      clientID: process.env.APPLE_CLIENT_ID as string,
      teamID: process.env.APPLE_TEAM_ID as string,
      keyID: process.env.APPLE_KEY_ID as string,
      privateKeyString: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      callbackURL: process.env.APPLE_REDIRECT_URI as string,
      passReqToCallback: true, 
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      idToken: any,
      profile: { email?: string; name?: string },
      done: (error: any, user?: any) => void
    ) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.email });

        // If user does not exist, create a new user
        if (!user) {
          user = new User({
            email: profile.email,
            name: profile.name,
            is_verified: true,
          });
          await user.save();
        }

        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// Route to start Apple login
export const loginWithApple = passport.authenticate("apple", {scope: ["email","name"]});

// Apple callback route
export const appleCallback = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Login Successful",
    user: req.user,
  });
};
//