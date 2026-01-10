import { Request, Response } from 'express';
import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import Grade from '../models/Grade.js';
import GradeConfig from '../models/GradeConfig.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Get lecturer's classes
 */
export const getLecturerClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lecturerId } = req.params;

    // Verify lecturer is accessing their own classes
    if (req.user?.id !== lecturerId && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'You can only access your own classes',
      });
      return;
    }

    const classes = await Class.find({ lecturerId })
      .populate('courseId', 'code name credits')
      .populate('semesterId', 'name code')
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
 * Get class details
 */
export const getClassDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lecturerId, classId } = req.params;

    // Verify lecturer owns this class
    const classDoc = await Class.findOne({ _id: classId, lecturerId });
    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found or you do not have access',
      });
      return;
    }

    const populated = await Class.findById(classId)
      .populate('courseId', 'code name credits')
      .populate('semesterId', 'name code')
      .populate('schedule.roomId', 'code name');

    res.json({
      success: true,
      data: populated,
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
    const { lecturerId, classId } = req.params;

    // Verify lecturer owns this class
    const classDoc = await Class.findOne({ _id: classId, lecturerId });
    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found or you do not have access',
      });
      return;
    }

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

/**
 * Get grades for a class
 */
export const getClassGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lecturerId, classId } = req.params;

    // Verify lecturer owns this class
    const classDoc = await Class.findOne({ _id: classId, lecturerId });
    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found or you do not have access',
      });
      return;
    }

    const grades = await Grade.find({ classId })
      .populate({
        path: 'enrollmentId',
        populate: {
          path: 'studentId',
          populate: { path: 'userId', select: 'name email' },
        },
      })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: grades,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update grade for a student
 */
export const updateGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lecturerId, classId, studentId } = req.params;
    const { midtermScore, finalScore, otherScores } = req.body;

    // Verify lecturer owns this class
    const classDoc = await Class.findOne({ _id: classId, lecturerId });
    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found or you do not have access',
      });
      return;
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      classId,
      studentId,
      status: 'registered',
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: 'Student not enrolled in this class',
      });
      return;
    }

    // Find or create grade
    let grade = await Grade.findOne({ enrollmentId: enrollment._id });

    if (!grade) {
      grade = new Grade({
        enrollmentId: enrollment._id,
        studentId,
        classId,
      });
    }

    // Get grade config for this class
    const gradeConfig = await GradeConfig.findOne({ classId });
    if (!gradeConfig) {
      res.status(400).json({
        success: false,
        error: 'Grade configuration not found for this class. Please configure grading components first.',
      });
      return;
    }

    // Check if locked
    if (gradeConfig.isLocked || (gradeConfig.deadline && new Date() > gradeConfig.deadline)) {
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Grade sheet is locked. Contact admin to unlock.',
        });
        return;
      }
    }

    // Store old values for audit log
    const oldGrade = grade.toObject();

    // Update scores
    if (midtermScore !== undefined) grade.midtermScore = midtermScore;
    if (finalScore !== undefined) grade.finalScore = finalScore;
    if (otherScores) grade.otherScores = otherScores;

    // Calculate final grade using config weights
    let totalScore = 0;
    let totalWeight = 0;

    for (const component of gradeConfig.components) {
      let score: number | undefined;
      
      if (component.name === 'Midterm' || component.name === 'Điểm quá trình') {
        score = midtermScore !== undefined ? midtermScore : grade.midtermScore;
      } else if (component.name === 'Final' || component.name === 'Điểm cuối kỳ') {
        score = finalScore !== undefined ? finalScore : grade.finalScore;
      } else {
        // Find in otherScores
        const otherScore = otherScores?.find((s: any) => s.name === component.name) ||
                          grade.otherScores?.find((s: any) => s.name === component.name);
        score = otherScore?.score;
      }

      if (score !== undefined && score !== null) {
        totalScore += score * (component.weight / 100);
        totalWeight += component.weight / 100;
      }
    }

    if (totalWeight > 0) {
      grade.finalGrade = totalScore / totalWeight;
      // Convert to letter grade
      if (grade.finalGrade >= 9.0) grade.letterGrade = 'A';
      else if (grade.finalGrade >= 8.5) grade.letterGrade = 'B+';
      else if (grade.finalGrade >= 8.0) grade.letterGrade = 'B';
      else if (grade.finalGrade >= 7.0) grade.letterGrade = 'C+';
      else if (grade.finalGrade >= 6.5) grade.letterGrade = 'C';
      else if (grade.finalGrade >= 5.5) grade.letterGrade = 'D+';
      else if (grade.finalGrade >= 5.0) grade.letterGrade = 'D';
      else grade.letterGrade = 'F';
    }

    await grade.save();

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'UPDATE_GRADE',
      resourceType: 'Grade',
      resourceId: grade._id,
      oldValue: oldGrade,
      newValue: {
        midtermScore: grade.midtermScore,
        finalScore: grade.finalScore,
        otherScores: grade.otherScores,
        finalGrade: grade.finalGrade,
        letterGrade: grade.letterGrade,
      },
      metadata: {
        classId: classId.toString(),
        studentId: studentId.toString(),
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: grade,
      message: 'Grade updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Bulk update grades
 * FIXED: Uses GradeConfig for weight validation
 */
export const bulkUpdateGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lecturerId, classId } = req.params;
    const { grades } = req.body; // Array of { studentId, midtermScore, finalScore, otherScores }

    // Verify lecturer owns this class
    const classDoc = await Class.findOne({ _id: classId, lecturerId });
    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found or you do not have access',
      });
      return;
    }

    // Get grade config once (reuse for all students)
    const gradeConfig = await GradeConfig.findOne({ classId });
    if (!gradeConfig) {
      res.status(400).json({
        success: false,
        error: 'Grade configuration not found for this class',
      });
      return;
    }

    // Check if locked
    if (gradeConfig.isLocked || (gradeConfig.deadline && new Date() > gradeConfig.deadline)) {
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Grade sheet is locked. Contact admin to unlock.',
        });
        return;
      }
    }

    const results = [];
    const auditLogs = [];

    for (const gradeData of grades) {
      const { studentId, midtermScore, finalScore, otherScores } = gradeData;

      // Find enrollment
      const enrollment = await Enrollment.findOne({
        classId,
        studentId,
        status: 'registered',
      });

      if (!enrollment) {
        results.push({ studentId, success: false, error: 'Not enrolled' });
        continue;
      }

      // Find or create grade
      let grade = await Grade.findOne({ enrollmentId: enrollment._id });

      if (!grade) {
        grade = new Grade({
          enrollmentId: enrollment._id,
          studentId,
          classId,
        });
      }

      // Store old values for audit
      const oldGrade = grade.toObject();

      // Update scores
      if (midtermScore !== undefined) grade.midtermScore = midtermScore;
      if (finalScore !== undefined) grade.finalScore = finalScore;
      if (otherScores) grade.otherScores = otherScores;

      // Calculate final grade using config weights
      let totalScore = 0;
      let totalWeight = 0;

      for (const component of gradeConfig.components) {
        let score: number | undefined;
        
        if (component.name === 'Midterm' || component.name === 'Điểm quá trình') {
          score = midtermScore !== undefined ? midtermScore : grade.midtermScore;
        } else if (component.name === 'Final' || component.name === 'Điểm cuối kỳ') {
          score = finalScore !== undefined ? finalScore : grade.finalScore;
        } else {
          const otherScore = otherScores?.find((s: any) => s.name === component.name) ||
                            grade.otherScores?.find((s: any) => s.name === component.name);
          score = otherScore?.score;
        }

        if (score !== undefined && score !== null) {
          totalScore += score * (component.weight / 100);
          totalWeight += component.weight / 100;
        }
      }

      if (totalWeight > 0) {
        grade.finalGrade = totalScore / totalWeight;
        if (grade.finalGrade >= 9.0) grade.letterGrade = 'A';
        else if (grade.finalGrade >= 8.5) grade.letterGrade = 'B+';
        else if (grade.finalGrade >= 8.0) grade.letterGrade = 'B';
        else if (grade.finalGrade >= 7.0) grade.letterGrade = 'C+';
        else if (grade.finalGrade >= 6.5) grade.letterGrade = 'C';
        else if (grade.finalGrade >= 5.5) grade.letterGrade = 'D+';
        else if (grade.finalGrade >= 5.0) grade.letterGrade = 'D';
        else grade.letterGrade = 'F';
      }

      await grade.save();
      results.push({ studentId, success: true });

      // Prepare audit log
      auditLogs.push({
        userId: req.user!.id,
        action: 'UPDATE_GRADE',
        resourceType: 'Grade',
        resourceId: grade._id,
        oldValue: oldGrade,
        newValue: {
          midtermScore: grade.midtermScore,
          finalScore: grade.finalScore,
          otherScores: grade.otherScores,
          finalGrade: grade.finalGrade,
          letterGrade: grade.letterGrade,
        },
        metadata: {
          classId: classId.toString(),
          studentId: studentId.toString(),
          bulkUpdate: true,
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      });
    }

    // Bulk insert audit logs
    if (auditLogs.length > 0) {
      await AuditLog.insertMany(auditLogs);
    }

    res.json({
      success: true,
      data: results,
      message: 'Bulk update completed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get grade template (for Excel export)
 */
export const getGradeTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lecturerId, classId } = req.params;

    // Verify lecturer owns this class
    const classDoc = await Class.findOne({ _id: classId, lecturerId });
    if (!classDoc) {
      res.status(404).json({
        success: false,
        error: 'Class not found or you do not have access',
      });
      return;
    }

    // Get enrolled students
    const enrollments = await Enrollment.find({
      classId,
      status: 'registered',
    })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ enrolledAt: 1 });

    // Format as CSV template
    const template = enrollments.map((enrollment: any, index: number) => ({
      STT: index + 1,
      MSSV: enrollment.studentId.studentId,
      'Họ tên': enrollment.studentId.userId.name,
      'Điểm QT (30%)': '',
      'Điểm CK (70%)': '',
    }));

    res.json({
      success: true,
      data: template,
      message: 'Template retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
