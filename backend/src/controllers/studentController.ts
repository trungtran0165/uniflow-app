import { Request, Response } from 'express';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Grade from '../models/Grade.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import mongoose from 'mongoose';

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
 * Get student dashboard data
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
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
    
    await student.populate('programId');

    // Get current active semester
    const currentSemester = await Semester.findOne({ isActive: true });
    
    // Get current enrollments
    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: { $in: ['registered', 'waitlist'] },
    }).populate({
      path: 'classId',
      populate: { path: 'courseId', select: 'code name credits' },
    });

    // Calculate current credits
    const currentCredits = enrollments.reduce((sum, enrollment: any) => {
      if (enrollment.status === 'registered' && enrollment.classId?.courseId) {
        return sum + (enrollment.classId.courseId.credits || 0);
      }
      return sum;
    }, 0);

    // Get GPA (simplified - will implement full calculation later)
    const grades = await Grade.find({
      studentId: student._id,
    }).populate('classId');

    res.json({
      success: true,
      data: {
        currentSemester: currentSemester?.name || 'N/A',
        creditsEnrolled: currentCredits,
        gpa: 0, // TODO: Calculate GPA
        alerts: [],
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
 * Get student transcript (grades by semester)
 */
export const getTranscript = async (req: Request, res: Response): Promise<void> => {
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

    // Get all grades grouped by semester
    const grades = await Grade.find({ studentId: student._id })
      .populate({
        path: 'classId',
        populate: [
          { path: 'courseId', select: 'code name credits' },
          { path: 'semesterId', select: 'name code' },
        ],
      })
      .sort({ createdAt: -1 });

    // Group by semester
    const terms: Record<string, any> = {};
    grades.forEach((grade: any) => {
      const semesterId = grade.classId?.semesterId?._id?.toString();
      if (!semesterId) return;

      if (!terms[semesterId]) {
        terms[semesterId] = {
          semester: grade.classId.semesterId,
          courses: [],
        };
      }

      terms[semesterId].courses.push({
        course: grade.classId.courseId,
        finalGrade: grade.finalGrade,
        letterGrade: grade.letterGrade,
      });
    });

    res.json({
      success: true,
      data: {
        terms: Object.values(terms),
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
 * Get transcript summary (cumulative GPA, credits)
 */
export const getTranscriptSummary = async (req: Request, res: Response): Promise<void> => {
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

    // Get all grades
    const grades = await Grade.find({ studentId: student._id })
      .populate({
        path: 'classId',
        populate: { path: 'courseId', select: 'credits' },
      });

    // Calculate cumulative GPA and credits
    let totalPoints = 0;
    let totalCredits = 0;

    grades.forEach((grade: any) => {
      if (grade.finalGrade !== null && grade.finalGrade !== undefined) {
        const credits = grade.classId?.courseId?.credits || 0;
        const points = grade.finalGrade * credits;
        totalPoints += points;
        totalCredits += credits;
      }
    });

    const cumulativeGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Determine ranking (simplified)
    let ranking = 'Chưa có';
    if (cumulativeGpa >= 3.6) ranking = 'Xuất sắc';
    else if (cumulativeGpa >= 3.2) ranking = 'Giỏi';
    else if (cumulativeGpa >= 2.5) ranking = 'Khá';
    else if (cumulativeGpa >= 2.0) ranking = 'Trung bình';
    else if (cumulativeGpa > 0) ranking = 'Yếu';

    res.json({
      success: true,
      data: {
        cumulativeGpa: parseFloat(cumulativeGpa.toFixed(2)),
        cumulativeCredits: totalCredits,
        ranking,
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
 * Export transcript as PDF (not implemented yet)
 */
export const exportTranscript = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    error: 'PDF export not yet implemented',
  });
};

/**
 * Get student timetable
 */
export const getTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Try to find by _id first (ObjectId), then by studentId (MSSV string), then by userId
    let student = await Student.findById(studentId);
    if (!student) {
      student = await Student.findOne({ studentId });
    }
    if (!student) {
      student = await Student.findOne({ userId: studentId });
    }
    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    // Get current active semester
    const currentSemester = await Semester.findOne({ isActive: true });
    if (!currentSemester) {
      res.status(404).json({
        success: false,
        error: 'No active semester found',
      });
      return;
    }

    // Get enrollments for current semester
    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'registered',
    }).populate({
      path: 'classId',
      match: { semesterId: currentSemester._id },
      populate: [
        { path: 'courseId', select: 'code name' },
        { path: 'schedule.roomId', select: 'code name' },
      ],
    });

    // Format timetable data
    const timetableData = enrollments
      .filter((enrollment: any) => enrollment.classId)
      .map((enrollment: any) => ({
        class: enrollment.classId,
        course: enrollment.classId.courseId,
        schedule: enrollment.classId.schedule,
      }));

    res.json({
      success: true,
      data: {
        currentWeek: 1, // TODO: Calculate current week
        weeks: [timetableData], // Simplified - should format by week
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
 * Get timetable for specific week
 */
export const getTimetableByWeek = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, week } = req.params;
    const weekNum = parseInt(week);

    const student = await findStudentByIdentifier(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    // Get current active semester
    const currentSemester = await Semester.findOne({ isActive: true });
    if (!currentSemester) {
      res.status(404).json({
        success: false,
        error: 'No active semester found',
      });
      return;
    }

    // Get enrollments for current semester
    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: 'registered',
    }).populate({
      path: 'classId',
      match: { semesterId: currentSemester._id },
      populate: [
        { path: 'courseId', select: 'code name' },
        { path: 'schedule.roomId', select: 'code name' },
      ],
    });

    // Format timetable data
    const timetableData = enrollments
      .filter((enrollment: any) => enrollment.classId)
      .map((enrollment: any) => ({
        class: enrollment.classId,
        course: enrollment.classId.courseId,
        schedule: enrollment.classId.schedule,
      }));

    res.json({
      success: true,
      data: {
        week: weekNum,
        days: timetableData, // TODO: Format by day of week
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
 * Get schedule changes
 */
export const getScheduleChanges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // TODO: Implement schedule changes tracking
    // For now, return empty array
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
