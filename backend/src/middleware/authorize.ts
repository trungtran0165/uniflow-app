import { Request, Response, NextFunction } from 'express';
import Student from '../models/Student.js';
import mongoose from 'mongoose';

type Role = 'student' | 'lecturer' | 'admin';

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions. Required role(s): ' + allowedRoles.join(', '),
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is accessing their own resource
 * For example: student can only access their own transcript
 */
export const authorizeSelfOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const isAdmin = req.user.role === 'admin';
  if (isAdmin) {
    next();
    return;
  }

  const resourceId = req.params.studentId || req.params.userId;
  if (!resourceId) {
    res.status(400).json({
      success: false,
      error: 'Resource ID is required',
    });
    return;
  }

  // ADDITIONAL: Verify studentId in body matches authenticated user (IDOR protection)
  if (req.body.studentId && req.body.studentId !== resourceId) {
    const bodyStudent = await Student.findOne({ 
      $or: [
        { _id: req.body.studentId },
        { studentId: req.body.studentId },
        { userId: req.body.studentId }
      ]
    });
    
    if (bodyStudent && bodyStudent.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'You can only perform actions on your own account',
      });
      return;
    }
  }

  // If resourceId is the same as user.id (User._id), allow access
  if (resourceId === req.user.id) {
    next();
    return;
  }

  // If resourceId is a Student._id or studentId (MSSV), check if it belongs to the user
  try {
    let student = null;
    
    // Try to find by _id (ObjectId)
    if (mongoose.Types.ObjectId.isValid(resourceId)) {
      student = await Student.findById(resourceId);
      if (!student) {
        // Try by userId
        student = await Student.findOne({ userId: resourceId });
      }
    }
    
    // If not found, try by studentId (MSSV string)
    if (!student) {
      student = await Student.findOne({ studentId: resourceId });
    }

    // If student found, check if it belongs to the current user
    if (student) {
      if (student.userId.toString() === req.user.id) {
        next();
        return;
      } else {
        // Student exists but doesn't belong to user
        res.status(403).json({
          success: false,
          error: 'You can only access your own resources',
        });
        return;
      }
    }

    // If not found, deny access (could be invalid studentId or user trying to access non-existent resource)
    res.status(403).json({
      success: false,
      error: 'You can only access your own resources',
    });
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authorization check failed',
    });
  }
};
