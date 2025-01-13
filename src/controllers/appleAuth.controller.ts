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
      privateKeyString: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      callbackURL: process.env.APPLE_REDIRECT_URI,
      passReqToCallback: true
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
        const email =
          profile.email || idToken?.email || idToken?.payload?.email;
        const name = profile.name || "Apple user";

        console.log("✅ ID Token:", idToken);
        console.info("Apple Login Profile:", profile);
        console.warn("Extracted Email:", email);
        console.info("Extracted Name:", name);

        let user = await User.findOne({ email });

        if (!user) {
          console.log("creating new user....");
          user = new User({
            appleId: idToken?.sub,
            email,
            is_verified: true,
            user_type: "basic"
          });
          console.log("User Data Before Save:", user);
          try {
            const savedUser = await user.save();
            console.log("User successfully saved to database:", savedUser);
          } catch (err) {
            console.log("Error saving user to database:", err);
          }
        } else {
          console.log("User found in database:", user);
        }
        done(null, user);
      } catch (error) {
        console.error("Error during Apple strategy authentication:", error);
        done(error, false);
      }
    }
  )
);
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Route to start Apple login
export const loginWithApple = passport.authenticate("apple", {
  scope: ["email", "name"]
});

// Apple callback route
export const appleCallback = (req: Request, res: Response) => {
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

