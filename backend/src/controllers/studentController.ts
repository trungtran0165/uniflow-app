import { Request, Response } from 'express';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Grade from '../models/Grade.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import mongoose from 'mongoose';

/**
 * Helper: Calculate letter grade from score
 */
function calculateLetterGrade(score: number): string {
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.5) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5.0) return 'D+';
  if (score >= 4.0) return 'D';
  return 'F';
}

/**
 * Helper: Calculate GPA from course list
 */
function calculateGPA(courses: any[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  courses.forEach((course) => {
    if (course.finalGrade > 0) {
      totalPoints += course.finalGrade * (course.credits || 0);
      totalCredits += course.credits || 0;
    }
  });
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

/**
 * Helper: Get ranking from GPA
 */
function getRanking(gpa: number): string {
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  if (gpa > 0) return 'Yếu';
  return 'Chưa có';
}

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
    
    // Get current enrollments (registered in current semester)
    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: { $in: ['registered', 'waitlist'] },
    }).populate({
      path: 'classId',
      populate: { path: 'courseId', select: 'code name credits' },
    });

    // Calculate current credits (enrolled this semester)
    const currentCredits = enrollments.reduce((sum, enrollment: any) => {
      if (enrollment.status === 'registered' && enrollment.classId?.courseId) {
        return sum + (enrollment.classId.courseId.credits || 0);
      }
      return sum;
    }, 0);

    // Get all grades to calculate GPA and accumulated credits
    const grades = await Grade.find({
      studentId: student._id,
    }).populate({
      path: 'classId',
      populate: { path: 'courseId', select: 'code name credits' },
    });

    // Calculate GPA and accumulated credits
    let totalPoints = 0;
    let totalCredits = 0;
    grades.forEach((grade: any) => {
      const credits = grade.classId?.courseId?.credits || 0;
      const finalGrade = grade.finalGrade || 0;
      if (finalGrade > 0) {
        totalPoints += finalGrade * credits;
        totalCredits += credits;
      }
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    res.json({
      success: true,
      data: {
        currentSemester: currentSemester?.name || 'N/A',
        currentCredits, // Credits enrolled this semester
        creditsAccumulated: totalCredits, // Total credits earned
        creditsTarget: 130, // Default graduation requirement
        gpa: parseFloat(gpa.toFixed(2)),
        gpaDelta: 0, // TODO: Calculate GPA change
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
    let totalPoints = 0;
    let totalCredits = 0;

    grades.forEach((grade: any) => {
      const semesterId = grade.classId?.semesterId?._id?.toString();
      if (!semesterId) return;

      if (!terms[semesterId]) {
        terms[semesterId] = {
          _id: semesterId,
          semesterId: grade.classId.semesterId,
          semester: grade.classId.semesterId,
          courses: [],
          gpa: 0,
          credits: 0,
        };
      }

      const credits = grade.classId?.courseId?.credits || 0;
      const finalGrade = grade.finalGrade || 0;

      terms[semesterId].courses.push({
        code: grade.classId.courseId?.code || 'N/A',
        courseCode: grade.classId.courseId?.code || 'N/A',
        name: grade.classId.courseId?.name || 'N/A',
        courseName: grade.classId.courseId?.name || 'N/A',
        credits,
        finalGrade,
        score: finalGrade,
        letterGrade: grade.letterGrade || calculateLetterGrade(finalGrade),
        grade: grade.letterGrade || calculateLetterGrade(finalGrade),
        midtermScore: grade.midtermScore,
        finalScore: grade.finalScore,
      });

      // Calculate semester GPA
      terms[semesterId].credits += credits;
      terms[semesterId].gpa = calculateGPA(terms[semesterId].courses);

      // Accumulate total
      if (finalGrade > 0) {
        totalPoints += finalGrade * credits;
        totalCredits += credits;
      }
    });

    const cumulativeGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    res.json({
      success: true,
      data: {
        terms: Object.values(terms),
        cumulativeGpa,
        cumulativeGpa4: cumulativeGpa,
        cumulativeCredits: totalCredits,
        ranking: getRanking(cumulativeGpa),
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
        { path: 'courseId', select: 'code name credits' },
        { path: 'schedule.roomId', select: 'code name' },
      ],
    });

    // Format schedule slots for timetable
    const scheduleSlots: any[] = [];
    enrollments
      .filter((enrollment: any) => enrollment.classId)
      .forEach((enrollment: any) => {
        const classData = enrollment.classId;
        const courseData = classData.courseId;
        
        classData.schedule?.forEach((slot: any) => {
          scheduleSlots.push({
            _id: slot._id,
            classId: classData._id,
            classCode: classData.code,
            courseName: courseData?.name || classData.name || 'N/A',
            courseCode: courseData?.code || 'N/A',
            dayOfWeek: slot.dayOfWeek,
            period: slot.period,
            roomId: slot.roomId?._id,
            roomCode: slot.roomId?.code || 'N/A',
            roomName: slot.roomId?.name || '',
            status: 'normal',
          });
        });
      });

    res.json({
      success: true,
      data: {
        weekLabel: `Tuần ${weekNum}`,
        schedule: scheduleSlots,
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
