import { Request, Response } from "express";
import passport, { session } from "passport";
import AppleStrategy from "passport-apple";
import User from "../models/users.model";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

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
      console.log("Apple Strategy Triggered");
      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);
      console.log("ID Token:", idToken);
      console.log("Profile:", profile);
      try {
        const email = profile.email || idToken?.payload?.email;
        const name = profile.name || "Apple user";
        // Check if user already exists
        let user = await User.findOne({ email });

        // If user does not exist, create a new user
        if (!user) {
          user = new User({
            email,
            name,
            is_verified: true,
            appleId : idToken?.sub,
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

// Route to start Apple login
export const loginWithApple = passport.authenticate("apple", {
  scope: ["email", "name"]
});

// Apple callback route
export const appleCallback = (req: Request, res: Response, next: any) => {
  console.log("Apple Callback triggered");

  passport.authenticate("apple", { session: true }, (err: Error | null, user: any, info: any) => {
    console.log("session in appleCallback :", session);
    
    if (err || !user) {
      console.log("Error or no user: ", err, info);
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const { accessToken, refreshToken } = user;
    console.log("User authenticated, tokens generated:");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    console.log("User authenticated, tokens generated:", accessToken, refreshToken);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  })(req, res, next);
};

