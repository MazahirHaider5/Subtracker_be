import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Access token required"
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    if ((error as Error).name === "TokenExpiredError") {
      if (req.url.includes("/refresh-token")) {
        return res.status(401).json({
          success: false,
          message: "Refresh token expired"
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Access token expired"
        });
      }
    }
    return res.status(401).json({
      success: false,
      message: "Refresh token expired",
      error: (error as Error).message
    });
  }
};
