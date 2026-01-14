import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Đăng ký tài khoản
 * Body:
 *  - common: { email, password, name, role }
 *  - if role=student: { studentId, programId, cohort, major, status? }
 *
 * Notes:
 *  - Backend uses role enum: student | lecturer | admin
 *  - Accepts role=teacher as an alias of lecturer
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
      // student-only fields
      studentId?: string;
      programId?: string;
      cohort?: string;
      major?: string;
      status?: 'active' | 'graduated' | 'suspended' | 'dropped';
    };

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, name and role are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role === 'teacher' ? 'lecturer' : role;
    const allowedRoles = new Set(['admin', 'student', 'lecturer']);

    if (!allowedRoles.has(normalizedRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Allowed roles: admin, student, teacher',
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email: normalizedEmail,
      name: name.trim(),
      password: hashedPassword,
      role: normalizedRole,
    });

    // If student, create Student profile (required for student APIs)
    let studentInfo: any = null;
    if (normalizedRole === 'student') {
      const { studentId, programId, cohort, major, status } = req.body as any;

      if (!studentId || !programId || !cohort || !major) {
        // Rollback created user if student profile is incomplete
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          error: 'studentId, programId, cohort, major are required when role is student',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(programId)) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          error: 'programId must be a valid ObjectId',
        });
      }

      try {
        studentInfo = await Student.create({
          userId: user._id,
          studentId: String(studentId).trim(),
          programId,
          cohort: String(cohort).trim(),
          major: String(major).trim(),
          status,
        });
        await studentInfo.populate('programId');
      } catch (err: any) {
        // Cleanup user if student creation fails
        await User.findByIdAndDelete(user._id);

        // Handle duplicate key errors (e.g., studentId already exists)
        if (err?.code === 11000) {
          const dupField = Object.keys(err?.keyValue || {})[0] || 'field';
          return res.status(409).json({
            success: false,
            error: `${dupField} already exists`,
          });
        }

        throw err;
      }
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        student: studentInfo
          ? {
              id: studentInfo._id,
              studentId: studentInfo.studentId,
              programId: studentInfo.programId,
              cohort: studentInfo.cohort,
              major: studentInfo.major,
              status: studentInfo.status,
            }
          : null,
      },
    });
  } catch (error: any) {
    // Handle duplicate key error for email
    if (error?.code === 11000) {
      const dupField = Object.keys(error?.keyValue || {})[0] || 'field';
      return res.status(409).json({
        success: false,
        error: `${dupField} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Register failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Đăng nhập
 * Body: { email, password }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Đăng xuất (client-side: remove token)
 * Server-side: could invalidate token in blacklist (not implemented yet)
 */
router.post('/logout', authenticate, async (_req: Request, res: Response) => {
  try {
    // TODO: Implement token blacklist if needed
    // For now, logout is handled client-side by removing token

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // If student, also get student info
    let studentInfo = null;
    if (user.role === 'student') {
      studentInfo = await Student.findOne({ userId: user._id }).populate('programId');
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        student: studentInfo ? {
          id: studentInfo._id,
          studentId: studentInfo.studentId,
          programId: studentInfo.programId,
          cohort: studentInfo.cohort,
          major: studentInfo.major,
          status: studentInfo.status,
        } : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user info',
    });
  }
});

export default router;
