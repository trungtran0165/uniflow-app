import { Request, Response } from 'express';
import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import RegistrationWindow from '../models/RegistrationWindow.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import ProgramCourse from '../models/ProgramCourse.js';
import Grade from '../models/Grade.js';
import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';
import { checkPrerequisitesRecursive } from '../utils/prerequisites.js';

/**
 * Helper function to find student by various identifiers
 * Tries: _id (ObjectId), studentId (MSSV string), userId (ObjectId)
 */
async function findStudentByIdentifier(identifier: string) {
  // Try by _id (ObjectId)
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await Student.findById(identifier);
    if (byId) return byId;
    
    // Try by userId
    const byUserId = await Student.findOne({ userId: identifier });
    if (byUserId) return byUserId;
  }
  
  // Try by studentId (MSSV string)
  const byStudentId = await Student.findOne({ studentId: identifier });
  if (byStudentId) return byStudentId;
  
  return null;
}

/**
 * Get open classes for registration
 */
export const getOpenClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find active registration window
    const activeWindow = await RegistrationWindow.findOne({
      status: 'open',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!activeWindow) {
      res.json({
        success: true,
        data: [],
        message: 'No active registration window',
      });
      return;
    }

    // If window has an explicit class list, only show those (that are open)
    // NOTE: When classIds is configured, we intentionally do NOT enforce semesterId
    // to avoid “wrong semester selected” causing students to see nothing.
    const hasExplicitList = Array.isArray((activeWindow as any).classIds) && (activeWindow as any).classIds.length > 0;
    const classFilter: any = hasExplicitList
      ? { _id: { $in: (activeWindow as any).classIds }, status: 'open' }
      : { semesterId: activeWindow.semesterId, status: 'open' };

    // Get open classes for the semester/window
    const classes = await Class.find(classFilter)
      .populate('courseId', 'code name credits')
      .populate('lecturerId', 'name email')
      .populate('schedule.roomId', 'code name');

    // Format response
    const formattedClasses = classes.map((cls: any) => ({
      id: cls._id,
      code: cls.code,
      course: cls.courseId,
      lecturer: cls.lecturerId,
      schedule: cls.schedule,
      capacity: cls.capacity,
      enrolled: cls.enrolled,
      available: cls.capacity - cls.enrolled,
      status: cls.enrolled >= cls.capacity ? 'full' : 'available',
    }));

    res.json({
      success: true,
      data: formattedClasses,
      message: 'Open classes retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Search open classes
 */
export const searchOpenClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, faculty } = req.query;

    // Get open classes first
    const activeWindow = await RegistrationWindow.findOne({
      status: 'open',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!activeWindow) {
      res.json({
        success: true,
        data: [],
        message: 'No active registration window',
      });
      return;
    }

    const hasExplicitList = Array.isArray((activeWindow as any).classIds) && (activeWindow as any).classIds.length > 0;
    let query: any = hasExplicitList
      ? { _id: { $in: (activeWindow as any).classIds }, status: 'open' }
      : { semesterId: activeWindow.semesterId, status: 'open' };

    // Build search query
    if (keyword) {
      query.$or = [
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }

    const classes = await Class.find(query)
      .populate({
        path: 'courseId',
        match: keyword
          ? {
              $or: [
                { code: { $regex: keyword, $options: 'i' } },
                { name: { $regex: keyword, $options: 'i' } },
              ],
            }
          : {},
        select: 'code name credits',
      })
      .populate('lecturerId', 'name email')
      .populate('schedule.roomId', 'code name');

    // Filter out classes without course (due to match)
    const filteredClasses = classes.filter((cls: any) => cls.courseId);

    res.json({
      success: true,
      data: filteredClasses,
      message: 'Search results retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Enroll student in a class
 * FIXED: Uses MongoDB transaction to prevent race condition
 */
export const enroll = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { studentId, classId, isForced, forceReason } = req.body;

    if (!studentId || !classId) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: 'Missing required fields: studentId, classId',
      });
      return;
    }

    // Find student (within transaction) - support both ObjectId and studentId string
    let student = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      // Try by _id first
      student = await Student.findById(studentId).session(session);
      if (!student) {
        // Try by userId
        student = await Student.findOne({ userId: studentId }).session(session);
      }
    }
    // If not found, try by studentId (MSSV string)
    if (!student) {
      student = await Student.findOne({ studentId }).session(session);
    }
    
    if (!student) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    // Authorization check: Student can only enroll themselves (unless admin)
    if (req.user?.role !== 'admin') {
      // Find student by userId to verify ownership
      const studentByUserId = await Student.findOne({ userId: req.user?.id }).session(session);
      if (!studentByUserId || studentByUserId._id.toString() !== student._id.toString()) {
        await session.abortTransaction();
        res.status(403).json({
          success: false,
          error: 'You can only enroll yourself',
        });
        return;
      }
    }

    // Find active registration window (within transaction)
    const activeWindow = await RegistrationWindow.findOne({
      status: 'open',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).session(session);

    if (!activeWindow) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: 'No active registration window',
      });
      return;
    }

    // Check if student is eligible (skip if forced by admin)
    const isForcedEnrollment = isForced && req.user?.role === 'admin';
    if (!isForcedEnrollment && activeWindow.targetCohorts && activeWindow.targetCohorts.length > 0) {
      if (!student.cohort) {
        await session.abortTransaction();
        res.status(403).json({
          success: false,
          error: 'Student cohort is not set',
        });
        return;
      }

      // Normalize cohort for comparison (remove "K" prefix if present, case-insensitive)
      const normalizeCohort = (cohort: string): string => {
        return cohort.replace(/^K/i, '').trim(); // Remove "K" prefix (case-insensitive) and trim
      };

      const studentCohortNormalized = normalizeCohort(student.cohort);
      const eligibleCohortsNormalized = activeWindow.targetCohorts.map(normalizeCohort);

      if (!eligibleCohortsNormalized.includes(studentCohortNormalized)) {
        await session.abortTransaction();
        res.status(403).json({
          success: false,
          error: `Student cohort "${student.cohort}" not eligible for this registration window. Eligible cohorts: ${activeWindow.targetCohorts.join(', ')}`,
        });
        return;
      }
    }

    // Find class (within transaction)
    const classDoc = await Class.findById(classId).populate('courseId').session(session);
    if (!classDoc) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        error: 'Class not found',
      });
      return;
    }

    // Validation 0: Course must be allowed for student's program (core/required/elective)
    // (skip if forced by admin)
    if (!isForcedEnrollment) {
      const courseId = (classDoc.courseId as any)._id || classDoc.courseId;
      const allowed = await ProgramCourse.findOne({
        programId: student.programId,
        courseId,
        isActive: true,
      }).session(session);

      if (!allowed) {
        await session.abortTransaction();
        res.status(403).json({
          success: false,
          error: 'Course not allowed for this student program (not in curriculum/electives list)',
        });
        return;
      }
    }

    // Check if already enrolled (within transaction)
    const existingEnrollment = await Enrollment.findOne({
      studentId: student._id,
      classId: classDoc._id,
      status: { $in: ['registered', 'waitlist'] },
    }).session(session);

    if (existingEnrollment) {
      await session.abortTransaction();
      res.status(409).json({
        success: false,
        error: 'Already enrolled in this class',
      });
      return;
    }

    // isForcedEnrollment already defined above (used for bypassing validations)

    // Check seat availability (before atomic update)
    // const isFull = classDoc.enrolled >= classDoc.capacity; // (unused; kept in atomic update below)

    // Validation 1: Check prerequisites with circular dependency detection (skip if forced)
    if (activeWindow.rules.checkPrerequisites && !isForcedEnrollment) {
      const courseId = (classDoc.courseId as any)._id || classDoc.courseId;
      const course = await Course.findById(courseId).session(session);
      if (course && course.prerequisites.length > 0) {
        // Get student's completed courses (with passing grades)
        const completedCourses = await Grade.find({
          studentId: student._id,
          finalGrade: { $gte: 5.0 }, // Passing grade
        })
          .populate({
            path: 'classId',
            select: 'courseId',
          })
          .session(session);

        const completedCourseIds = new Set(
          completedCourses
            .map((grade: any) => grade.classId?.courseId?.toString())
            .filter(Boolean)
        );

        // Recursive check with cycle detection
        const prereqCheck = await checkPrerequisitesRecursive(
          courseId,
          student._id,
          completedCourseIds
        );

        if (prereqCheck.cycle) {
          await session.abortTransaction();
          const cycleCourses = await Course.find({
            _id: { $in: prereqCheck.cycle },
          }).select('code name');
          
          res.status(400).json({
            success: false,
            error: 'Circular dependency detected in prerequisites',
            details: {
              cycle: prereqCheck.cycle.map(id => id.toString()),
              cycleCourses,
            },
          });
          return;
        }

        if (!prereqCheck.valid) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: 'Prerequisites not met',
            details: {
              missingPrerequisites: prereqCheck.missing,
            },
          });
          return;
        }
      }
    }

    // Validation 2: Check schedule conflicts (skip if forced)
    // FIXED: Optimized to avoid N+1 queries
    if (activeWindow.rules.checkScheduleConflict && !isForcedEnrollment) {
      // Batch query all enrollments and schedules (within transaction)
      const currentEnrollments = await Enrollment.find({
        studentId: student._id,
        status: 'registered',
      })
        .populate({
          path: 'classId',
          match: { semesterId: classDoc.semesterId },
          select: 'schedule',
        })
        .session(session)
        .lean(); // Use lean() for better performance

      // Build schedule map in memory (O(1) lookup)
      const scheduleMap = new Map<string, boolean>();
      currentEnrollments
        .filter((e: any) => e.classId)
        .forEach((enrollment: any) => {
          enrollment.classId.schedule.forEach((slot: any) => {
            const key = `${slot.dayOfWeek}-${slot.period}`;
            scheduleMap.set(key, true);
          });
        });

      // Check for conflicts (O(n) where n = number of new schedule slots)
      for (const newSchedule of classDoc.schedule) {
        const key = `${newSchedule.dayOfWeek}-${newSchedule.period}`;
        if (scheduleMap.has(key)) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: 'Schedule conflict detected',
            details: {
              dayOfWeek: newSchedule.dayOfWeek,
              period: newSchedule.period,
            },
          });
          return;
        }
      }
    }

    // Validation 3: Check credit limit (skip if forced)
    if (activeWindow.rules.checkCreditLimit && !isForcedEnrollment) {
      // Get current enrollments for this registration window
      const currentEnrollments = await Enrollment.find({
        studentId: student._id,
        registrationWindowId: activeWindow._id,
        status: 'registered',
      }).populate({
        path: 'classId',
        populate: { path: 'courseId', select: 'credits' },
      });

      const currentCredits = currentEnrollments.reduce((sum: number, enrollment: any) => {
        return sum + (enrollment.classId?.courseId?.credits || 0);
      }, 0);

      const courseId = (classDoc.courseId as any)._id || classDoc.courseId;
      const course = await Course.findById(courseId).session(session);
      const newCredits = course?.credits || 0;
      const totalCredits = currentCredits + newCredits;

      if (totalCredits > activeWindow.maxCredits) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          error: 'Credit limit exceeded',
          details: {
            currentCredits,
            newCredits,
            totalCredits,
            maxCredits: activeWindow.maxCredits,
          },
        });
        return;
      }

      if (totalCredits < activeWindow.minCredits && currentCredits + newCredits < activeWindow.minCredits) {
        // Warning but allow (can be enforced if needed)
        // For now, just a warning
      }
    }

    // ATOMIC OPERATION: Try to increment enrolled count only if not full
    // This prevents race condition where 2 students enroll simultaneously
    // Do this AFTER all validations pass
    let classUpdate;
    let enrollmentStatus: 'registered' | 'waitlist' = 'registered';
    let waitlistPosition = 0;

    if (!isForcedEnrollment) {
      // Try atomic update: only increment if not full
      classUpdate = await Class.findOneAndUpdate(
        {
          _id: classId,
          enrolled: { $lt: classDoc.capacity }, // Only update if not full
        },
        { $inc: { enrolled: 1 } },
        {
          session,
          new: true,
          runValidators: true,
        }
      );

      if (!classUpdate) {
        // Class is full (or became full between check and update)
        if (activeWindow.rules.allowWaitlist) {
          enrollmentStatus = 'waitlist';
          // Get waitlist count (within transaction)
          const waitlistCount = await Enrollment.countDocuments({
            classId: classDoc._id,
            status: 'waitlist',
          }).session(session);
          waitlistPosition = waitlistCount + 1;
        } else {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: 'Class is full',
          });
          return;
        }
      } else {
        // Successfully enrolled - verify capacity wasn't exceeded
        if (classUpdate.enrolled > classUpdate.capacity) {
          // Rollback if somehow exceeded (shouldn't happen with atomic update)
          await Class.findByIdAndUpdate(
            classId,
            { $inc: { enrolled: -1 } },
            { session }
          );
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: 'Class capacity exceeded',
          });
          return;
        }
      }
    } else {
      // Force add: bypass capacity check
      classUpdate = await Class.findByIdAndUpdate(
        classId,
        { $inc: { enrolled: 1 } },
        {
          session,
          new: true,
        }
      );
      enrollmentStatus = 'registered';
    }


    // Create enrollment (within transaction)
    const enrollment = new Enrollment({
      studentId: student._id,
      classId: classDoc._id,
      registrationWindowId: activeWindow._id,
      status: enrollmentStatus,
      waitlistPosition,
      isForced: isForcedEnrollment || false,
      forcedBy: isForcedEnrollment ? req.user!.id : undefined,
      forcedAt: isForcedEnrollment ? new Date() : undefined,
      forceReason: isForcedEnrollment ? forceReason : undefined,
    });

    await enrollment.save({ session });

    // Audit log for forced enrollment
    if (isForcedEnrollment) {
      await AuditLog.create([{
        userId: req.user!.id,
        action: 'FORCE_ENROLL',
        resourceType: 'Enrollment',
        resourceId: enrollment._id,
        oldValue: null,
        newValue: {
          studentId: student._id.toString(),
          classId: classDoc._id.toString(),
          reason: forceReason || 'Admin force add',
        },
        metadata: {
          isForced: true,
          studentId: student.studentId,
          classCode: classDoc.code,
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      }], { session });
    }

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        enrollmentId: enrollment._id,
        status: enrollmentStatus,
        waitlistPosition: enrollmentStatus === 'waitlist' ? waitlistPosition : undefined,
        isForced: isForcedEnrollment,
      },
      message: isForcedEnrollment
        ? 'Force enrollment successful'
        : enrollmentStatus === 'waitlist'
        ? 'Added to waitlist'
        : 'Enrollment successful',
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    
    // Handle duplicate key error (unique index violation)
    if (error instanceof Error && error.message.includes('E11000')) {
      res.status(409).json({
        success: false,
        error: 'Already enrolled in this class',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    // End session
    session.endSession();
  }
};

/**
 * Get student enrollments
 */
export const getEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const student = await findStudentByIdentifier(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: { $in: ['registered', 'waitlist'] },
    })
      .populate({
        path: 'classId',
        populate: [
          { path: 'courseId', select: 'code name credits' },
          { path: 'semesterId', select: 'name' },
          { path: 'schedule.roomId', select: 'code name' },
        ],
      })
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      data: enrollments,
      message: 'Enrollments retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Cancel enrollment
 * FIXED: Auto-promotes waitlist student when a registered student cancels
 */
export const cancelEnrollment = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('classId')
      .populate('registrationWindowId')
      .session(session);
    
    if (!enrollment) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        error: 'Enrollment not found',
      });
      return;
    }

    // Check if registration window deadline has passed (only for non-admin users)
    if (req.user?.role !== 'admin') {
      const registrationWindow = enrollment.registrationWindowId as any;
      if (registrationWindow && registrationWindow.endDate) {
        const now = new Date();
        const deadline = new Date(registrationWindow.endDate);
        
        if (now > deadline) {
          await session.abortTransaction();
          res.status(403).json({
            success: false,
            error: 'Cannot cancel enrollment after registration deadline. Please contact academic advisor for assistance.',
            deadline: deadline.toISOString(),
          });
          return;
        }
      }
    }

    const wasRegistered = enrollment.status === 'registered';
    const classId = (enrollment.classId as any)._id || enrollment.classId;

    // Update enrollment status
    enrollment.status = 'cancelled';
    enrollment.cancelledAt = new Date();
    await enrollment.save({ session });

    if (wasRegistered) {
      // ATOMIC: Decrement enrolled count
      await Class.findByIdAndUpdate(
        classId,
        { $inc: { enrolled: -1 } },
        { session }
      );

      // AUTO-PROMOTE: Get next student from waitlist
      const nextWaitlistStudent = await Enrollment.findOne(
        {
          classId,
          status: 'waitlist',
        },
        null,
        {
          session,
          sort: { waitlistPosition: 1 }, // First in queue
        }
      );

      if (nextWaitlistStudent) {
        const oldPosition = nextWaitlistStudent.waitlistPosition;

        // Promote to registered
        nextWaitlistStudent.status = 'registered';
        nextWaitlistStudent.waitlistPosition = 0;
        await nextWaitlistStudent.save({ session });

        // Increment enrolled count
        await Class.findByIdAndUpdate(
          classId,
          { $inc: { enrolled: 1 } },
          { session }
        );

        // Reorder remaining waitlist positions
        await Enrollment.updateMany(
          {
            classId,
            status: 'waitlist',
            waitlistPosition: { $gt: oldPosition },
          },
          { $inc: { waitlistPosition: -1 } },
          { session }
        );

        // Audit log for auto-promotion
        await AuditLog.create([{
          userId: req.user?.id || null,
          action: 'FORCE_ENROLL', // Using same action for auto-promote
          resourceType: 'Enrollment',
          resourceId: nextWaitlistStudent._id,
          oldValue: { status: 'waitlist', waitlistPosition: oldPosition },
          newValue: { status: 'registered', waitlistPosition: 0 },
          metadata: {
            autoPromoted: true,
            triggeredBy: enrollmentId,
          },
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('user-agent'),
        }], { session });

        // TODO: Send notification to promoted student
      }
    }

    // Audit log for cancellation
    await AuditLog.create([{
      userId: req.user?.id || null,
      action: 'CANCEL_ENROLLMENT',
      resourceType: 'Enrollment',
      resourceId: enrollment._id,
      oldValue: { status: enrollment.status, classId: classId.toString() },
      newValue: { status: 'cancelled', cancelledAt: new Date() },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    }], { session });

    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Enrollment cancelled successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get registration summary
 */
export const getRegistrationSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const student = await findStudentByIdentifier(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    // Get active registration window
    const activeWindow = await RegistrationWindow.findOne({
      status: 'open',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    // Get current enrollments
    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'registered',
    }).populate({
      path: 'classId',
      populate: { path: 'courseId', select: 'credits' },
    });

    // Calculate current credits
    const currentCredits = enrollments.reduce((sum: number, enrollment: any) => {
      return sum + (enrollment.classId?.courseId?.credits || 0);
    }, 0);

    // Format deadline for display
    const formatDeadline = (date: Date | undefined): string => {
      if (!date) return 'N/A';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    res.json({
      success: true,
      data: {
        currentCredits,
        minCredits: activeWindow?.minCredits || 0,
        maxCredits: activeWindow?.maxCredits || 24,
        deadline: formatDeadline(activeWindow?.endDate),
        deadlineDate: activeWindow?.endDate || null,
        startDate: activeWindow?.startDate || null,
        isActive: activeWindow ? new Date() >= new Date(activeWindow.startDate) && new Date() <= new Date(activeWindow.endDate) : false,
        curriculumProgress: {}, // TODO: Calculate curriculum progress
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get registration history
 */
export const getRegistrationHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { action, result } = req.query;

    const student = await findStudentByIdentifier(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    let query: any = { studentId: student._id };

    // Filter by status (action)
    if (action === 'register') {
      query.status = { $in: ['registered', 'waitlist'] };
    } else if (action === 'cancel') {
      query.status = 'cancelled';
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'classId',
        populate: { path: 'courseId', select: 'code name' },
      })
      .sort({ createdAt: -1 });

    // Format history
    const history = enrollments.map((enrollment: any) => ({
      id: enrollment._id,
      action: enrollment.status === 'cancelled' ? 'cancel' : 'register',
      classCode: enrollment.classId?.code || 'N/A',
      className: enrollment.classId?.courseId?.name || 'N/A',
      timestamp: enrollment.enrolledAt || enrollment.cancelledAt,
      result: enrollment.status === 'cancelled' ? 'success' : 'success',
      reason: enrollment.notes || undefined,
    }));

    res.json({
      success: true,
      data: history,
      message: 'History retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
