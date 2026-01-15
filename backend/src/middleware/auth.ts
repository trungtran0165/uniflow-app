import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'student' | 'lecturer' | 'admin';
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided. Authorization header must be: Bearer <token>',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

      // Verify user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Attach user info to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role as 'student' | 'lecturer' | 'admin',
      };

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
        return;
      }
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    });
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};
