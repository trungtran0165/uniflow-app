import { Request, Response } from 'express';
import Class from '../../models/Class.js';
import Enrollment from '../../models/Enrollment.js';
import Semester from '../../models/Semester.js';
import AuditLog from '../../models/AuditLog.js';

/**
 * Get all classes
 */
export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { semesterId } = req.query;

    const filter: any = {};
    if (semesterId) {
      filter.semesterId = semesterId;
    }

    const classes = await Class.find(filter)
      .populate('courseId', 'code name credits')
      .populate('lecturerId', 'name email')
      .populate('semesterId', 'name code')
      .populate('schedule.roomId', 'code name')
      .sort({ code: 1 });

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create new class
 * FIXED: Checks for room and lecturer conflicts
 */
export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, courseId, semesterId, lecturerId, schedule, capacity, notes } = req.body;

    // Check if class code already exists
    const existing = await Class.findOne({ code });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Class code already exists',
      });
      return;
    }

    // Check for room conflicts (only if schedule is provided)
    if (schedule && schedule.length > 0) {
      for (const slot of schedule) {
        const roomConflict = await Class.findOne({
          semesterId,
          'schedule.roomId': slot.roomId,
          'schedule.dayOfWeek': slot.dayOfWeek,
          'schedule.period': slot.period,
          status: { $in: ['open', 'draft'] },
        });

        if (roomConflict) {
          res.status(409).json({
            success: false,
            error: 'Room conflict detected',
            details: {
              roomId: slot.roomId,
              dayOfWeek: slot.dayOfWeek,
              period: slot.period,
              conflictingClass: roomConflict.code,
            },
          });
          return;
        }

        // Check lecturer conflict
        const lecturerConflict = await Class.findOne({
          semesterId,
          lecturerId,
          'schedule.dayOfWeek': slot.dayOfWeek,
          'schedule.period': slot.period,
          status: { $in: ['open', 'draft'] },
        });

        if (lecturerConflict) {
          res.status(409).json({
            success: false,
            error: 'Lecturer schedule conflict detected',
            details: {
              lecturerId,
              dayOfWeek: slot.dayOfWeek,
              period: slot.period,
              conflictingClass: lecturerConflict.code,
            },
          });
          return;
        }
      }
    }

    const classDoc = new Class({
      code,
      courseId,
      semesterId,
      lecturerId,
      schedule: schedule || [], // Default to empty array if not provided
      capacity,
      enrolled: 0,
      status: 'draft', // Create as draft if no schedule, can be changed to 'open' after adding schedule
      notes: notes || '',
    });

    await classDoc.save();

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'CREATE_CLASS',
      resourceType: 'Class',
      resourceId: classDoc._id,
      newValue: { code, courseId, semesterId, lecturerId, schedule, capacity },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    const populated = await Class.findById(classDoc._id)
      .populate('courseId', 'code name credits')
      .populate('lecturerId', 'name email')
      .populate('semesterId', 'name code')
      .populate('schedule.roomId', 'code name');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Class created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get class by ID
 */
export const getClassById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    const classDoc = await Class.findById(classId)
      .populate('courseId', 'code name credits')
      .populate('lecturerId', 'name email')
      .populate('semesterId', 'name code')
      .populate('schedule.roomId', 'code name');

    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found',
      });
      return;
    }

    res.json({
      success: true,
      data: classDoc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update class
 * FIXED: Checks for conflicts when updating schedule
 */
export const updateClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const updateData = req.body;

    // Get old class data for audit log
    const oldClass = await Class.findById(classId);

    // Check for conflicts if schedule is being updated
    if (updateData.schedule) {
      const currentClass = await Class.findById(classId);
      if (!currentClass) {
        res.status(404).json({
          success: false,
          error: 'Class not found',
        });
        return;
      }

      for (const slot of updateData.schedule) {
        const roomConflict = await Class.findOne({
          semesterId: updateData.semesterId || currentClass.semesterId,
          'schedule.roomId': slot.roomId,
          'schedule.dayOfWeek': slot.dayOfWeek,
          'schedule.period': slot.period,
          status: { $in: ['open', 'draft'] },
          _id: { $ne: classId }, // Exclude current class
        });

        if (roomConflict) {
          res.status(409).json({
            success: false,
            error: 'Room conflict detected',
            details: {
              roomId: slot.roomId,
              dayOfWeek: slot.dayOfWeek,
              period: slot.period,
              conflictingClass: roomConflict.code,
            },
          });
          return;
        }

        const lecturerConflict = await Class.findOne({
          semesterId: updateData.semesterId || currentClass.semesterId,
          lecturerId: updateData.lecturerId || currentClass.lecturerId,
          'schedule.dayOfWeek': slot.dayOfWeek,
          'schedule.period': slot.period,
          status: { $in: ['open', 'draft'] },
          _id: { $ne: classId },
        });

        if (lecturerConflict) {
          res.status(409).json({
            success: false,
            error: 'Lecturer schedule conflict detected',
            details: {
              lecturerId: updateData.lecturerId || currentClass.lecturerId,
              dayOfWeek: slot.dayOfWeek,
              period: slot.period,
              conflictingClass: lecturerConflict.code,
            },
          });
          return;
        }
      }
    }

    const classDoc = await Class.findByIdAndUpdate(
      classId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('courseId', 'code name credits')
      .populate('lecturerId', 'name email')
      .populate('semesterId', 'name code')
      .populate('schedule.roomId', 'code name');

    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found',
      });
      return;
    }

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'UPDATE_CLASS',
      resourceType: 'Class',
      resourceId: classDoc._id,
      oldValue: oldClass?.toObject(),
      newValue: updateData,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: classDoc,
      message: 'Class updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete class
 */
export const deleteClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    // Get class data for audit log before deletion
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found',
      });
      return;
    }

    // Check if class has enrollments
    const enrollmentCount = await Enrollment.countDocuments({
      classId,
      status: { $in: ['registered', 'waitlist'] },
    });

    if (enrollmentCount > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete class with ${enrollmentCount} active enrollments`,
      });
      return;
    }

    await Class.findByIdAndDelete(classId);

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'DELETE_CLASS',
      resourceType: 'Class',
      resourceId: classId,
      oldValue: classDoc.toObject(),
      newValue: null,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get students in a class
 */
export const getClassStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    const enrollments = await Enrollment.find({
      classId,
      status: 'registered',
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ enrolledAt: 1 });

    const students = enrollments.map((enrollment: any) => ({
      enrollmentId: enrollment._id,
      student: enrollment.studentId,
      enrolledAt: enrollment.enrolledAt,
    }));

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
