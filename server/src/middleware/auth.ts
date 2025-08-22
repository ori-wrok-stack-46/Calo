import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth";

export interface AuthRequest extends Request {
  user?: any;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("🔐 Authenticating request...");

    // Try to get token from cookies first (web), then fallback to Authorization header (mobile)
    let token = req.cookies.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        console.log("📱 Using Bearer token from header (mobile)");
      }
    } else {
      console.log("🍪 Using token from cookie (web)");
    }

    if (!token) {
      console.log("❌ No token found in cookies or headers");
      return res.status(401).json({
        success: false,
        error: "Missing or invalid authorization",
      });
    }

    console.log("🔍 Verifying token...");
    const user = await AuthService.verifyToken(token);
    console.log("✅ Token verified for user:", user.user_id);

    req.user = user;
    next();
  } catch (error: any) {
    console.error("💥 Token verification failed:", error.message);

    // Check if it's a database connection error
    if (
      error.message?.includes("Can't reach database server") ||
      error.message?.includes("connection")
    ) {
      return res.status(503).json({
        success: false,
        error: "Database temporarily unavailable, please try again",
        retryAfter: 5,
      });
    }

    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
}
