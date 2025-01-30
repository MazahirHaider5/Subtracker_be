import jwt from "jsonwebtoken";
import { IUser } from "../models/users.model";
import { Request, Response, NextFunction } from "express";

export const generateAccessToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1d"
    }
  );
};


export const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret);
  } catch {
    throw new Error("Invalid token");
  }
};

export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if(!token) {
    return res.status(401).json({success: false, message: "No token provided"});
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({success: false, message: "Invalid token"});
  }
};


