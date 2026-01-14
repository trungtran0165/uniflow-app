import { Request, Response } from 'express';
import Class from '../../models/Class.js';
import Enrollment from '../../models/Enrollment.js';
import Student from '../../models/Student.js';
import RegistrationWindow from '../../models/RegistrationWindow.js';
import AuditLog from '../../models/AuditLog.js';
import mongoose from 'mongoose';

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
    if (!oldClass) {
      res.status(404).json({
        success: false,
        error: 'Class not found',
      });
      return;
    }

    // Guard: if opening a class, ensure it has schedule
    if (updateData.status === 'open') {
      const nextSchedule = Array.isArray(updateData.schedule) ? updateData.schedule : oldClass.schedule;
      if (!nextSchedule || nextSchedule.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot open class without schedule. Please add schedule first.',
        });
        return;
      }
    }

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
      status: { $in: ['registered', 'waitlist'] },
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ status: 1, waitlistPosition: 1, enrolledAt: 1 });

    const students = enrollments.map((enrollment: any) => ({
      enrollmentId: enrollment._id,
      student: enrollment.studentId,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status,
      waitlistPosition: enrollment.waitlistPosition,
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

async function findStudentByIdentifier(identifier: string, session?: mongoose.ClientSession) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await Student.findById(identifier).session(session || null);
    if (byId) return byId;
    const byUserId = await Student.findOne({ userId: identifier }).session(session || null);
    if (byUserId) return byUserId;
  }
  const byStudentId = await Student.findOne({ studentId: identifier }).session(session || null);
  if (byStudentId) return byStudentId;
  return null;
}

/**
 * POST /api/admin/classes/:classId/students
 * Body: { studentIdentifier, force?, forceReason?, allowWaitlist?, status? }
 */
export const addStudentToClass = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { classId } = req.params;
    const { studentIdentifier, force, forceReason, allowWaitlist, status } = req.body as {
      studentIdentifier?: string;
      force?: boolean;
      forceReason?: string;
      allowWaitlist?: boolean;
      status?: 'registered' | 'waitlist';
    };

    if (!studentIdentifier) {
      await session.abortTransaction();
      res.status(400).json({ success: false, error: 'studentIdentifier is required' });
      return;
    }

    const classDoc = await Class.findById(classId).session(session);
    if (!classDoc) {
      await session.abortTransaction();
      res.status(404).json({ success: false, error: 'Class not found' });
      return;
    }

    const student = await findStudentByIdentifier(studentIdentifier, session);
    if (!student) {
      await session.abortTransaction();
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    // Enrollment has unique index (studentId, classId). If the student previously cancelled/dropped,
    // we must "reactivate" the existing enrollment instead of creating a new one.
    const existingAny = await Enrollment.findOne({
      classId: classDoc._id,
      studentId: student._id,
    }).session(session);

    if (existingAny && ['registered', 'waitlist'].includes(existingAny.status)) {
      await session.abortTransaction();
      res.status(409).json({ success: false, error: 'Student already in this class' });
      return;
    }

    const isForce = Boolean(force);
    const allowWl = allowWaitlist !== undefined ? Boolean(allowWaitlist) : true;

    // Pick a registration window if exists (optional)
    const anyWindow = await RegistrationWindow.findOne({ semesterId: classDoc.semesterId })
      .sort({ createdAt: -1 })
      .session(session);

    let enrollmentStatus: 'registered' | 'waitlist' = 'registered';
    let waitlistPosition = 0;

    if (status === 'waitlist') {
      enrollmentStatus = 'waitlist';
    }

    if (!isForce) {
      if (enrollmentStatus === 'registered' && classDoc.enrolled >= classDoc.capacity) {
        if (!allowWl) {
          await session.abortTransaction();
          res.status(400).json({ success: false, error: 'Class is full' });
          return;
        }
        enrollmentStatus = 'waitlist';
      }
    }

    if (enrollmentStatus === 'waitlist') {
      const waitlistCount = await Enrollment.countDocuments({
        classId: classDoc._id,
        status: 'waitlist',
      }).session(session);
      waitlistPosition = waitlistCount + 1;
    } else {
      // registered
      await Class.findByIdAndUpdate(classDoc._id, { $inc: { enrolled: 1 } }, { session });
    }

    const now = new Date();

    let enrollmentId: string;
    if (existingAny && ['cancelled', 'dropped'].includes(existingAny.status)) {
      existingAny.status = enrollmentStatus;
      existingAny.waitlistPosition = waitlistPosition;
      existingAny.enrolledAt = now;
      existingAny.cancelledAt = undefined;
      existingAny.isForced = isForce;
      existingAny.forcedBy = isForce ? (req.user!.id as any) : undefined;
      existingAny.forcedAt = isForce ? now : undefined;
      existingAny.forceReason = isForce ? forceReason : undefined;
      existingAny.registrationWindowId = anyWindow?._id as any;
      await existingAny.save({ session });
      enrollmentId = existingAny._id.toString();
    } else {
      const enrollment = await Enrollment.create(
        [
          {
            studentId: student._id,
            classId: classDoc._id,
            registrationWindowId: anyWindow?._id,
            status: enrollmentStatus,
            waitlistPosition,
            isForced: isForce,
            forcedBy: isForce ? req.user!.id : undefined,
            forcedAt: isForce ? now : undefined,
            forceReason: isForce ? forceReason : undefined,
          },
        ],
        { session }
      );
      enrollmentId = enrollment[0]._id.toString();
    }

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      data: {
        enrollmentId,
        status: enrollmentStatus,
        waitlistPosition: enrollmentStatus === 'waitlist' ? waitlistPosition : undefined,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    if (error?.code === 11000) {
      res.status(409).json({ success: false, error: 'Student already in this class' });
      return;
    }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    session.endSession();
  }
};

/**
 * DELETE /api/admin/classes/:classId/students/:enrollmentId
 * Cancel enrollment and auto-promote waitlist
 */
export const removeStudentFromClass = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { classId, enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId).session(session);
    if (!enrollment || enrollment.classId.toString() !== classId) {
      await session.abortTransaction();
      res.status(404).json({ success: false, error: 'Enrollment not found' });
      return;
    }

    if (!['registered', 'waitlist'].includes(enrollment.status)) {
      await session.abortTransaction();
      res.status(400).json({ success: false, error: 'Enrollment is not active' });
      return;
    }

    const wasRegistered = enrollment.status === 'registered';
    enrollment.status = 'cancelled';
    enrollment.cancelledAt = new Date();
    await enrollment.save({ session });

    if (wasRegistered) {
      await Class.findByIdAndUpdate(classId, { $inc: { enrolled: -1 } }, { session });

      // promote next waitlist
      const next = await Enrollment.findOne(
        { classId, status: 'waitlist' },
        null,
        { session, sort: { waitlistPosition: 1 } }
      );

      if (next) {
        const oldPos = next.waitlistPosition;
        next.status = 'registered';
        next.waitlistPosition = 0;
        await next.save({ session });

        await Class.findByIdAndUpdate(classId, { $inc: { enrolled: 1 } }, { session });

        await Enrollment.updateMany(
          { classId, status: 'waitlist', waitlistPosition: { $gt: oldPos } },
          { $inc: { waitlistPosition: -1 } },
          { session }
        );
      }
    } else {
      // removing from waitlist: close the gap in positions
      const oldPos = enrollment.waitlistPosition;
      if (oldPos && oldPos > 0) {
        await Enrollment.updateMany(
          { classId, status: 'waitlist', waitlistPosition: { $gt: oldPos } },
          { $inc: { waitlistPosition: -1 } },
          { session }
        );
      }
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Student removed from class' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    session.endSession();
  }
};
