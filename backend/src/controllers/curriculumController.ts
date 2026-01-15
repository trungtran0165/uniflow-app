import { Request, Response } from 'express';
import Program from '../models/Program.js';
import Course from '../models/Course.js';
import ProgramCourse from '../models/ProgramCourse.js';

/**
 * Get all programs with optional filters
 */
export const getPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const { system, cohort, major } = req.query;

    const filter: any = { isActive: true };

    if (system && (system === 'chinh-quy' || system === 'tu-xa')) {
      filter.system = system;
    }
    if (cohort) {
      filter.cohort = cohort;
    }
    if (major) {
      filter.major = major;
    }

    const programs = await Program.find(filter).sort({ cohort: -1, major: 1 });

    res.json({
      success: true,
      data: programs,
      message: 'Programs retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get program by ID
 */
export const getProgramById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      res.status(404).json({
        success: false,
        error: 'Program not found',
      });
      return;
    }

    res.json({
      success: true,
      data: program,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get courses for a program
 */
export const getProgramCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      res.status(404).json({
        success: false,
        error: 'Program not found',
      });
      return;
    }

    // Use ProgramCourse mapping (supports core/required/elective and cross-program electives)
    const mappings = await ProgramCourse.find({ programId: program._id, isActive: true })
      .populate({
        path: 'courseId',
        match: { isActive: true },
      })
      .sort({ recommendedSemester: 1, createdAt: 1 });

    // Flatten to Course[] for backward compatibility
    const courses = mappings
      .map((m: any) => m.courseId)
      .filter(Boolean);

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get prerequisites for a program
 */
export const getProgramPrerequisites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      res.status(404).json({
        success: false,
        error: 'Program not found',
      });
      return;
    }

    const mappings = await ProgramCourse.find({ programId: program._id, isActive: true })
      .populate({
        path: 'courseId',
        match: { isActive: true },
        populate: { path: 'prerequisites', select: 'code name' },
      });

    const courses = mappings
      .map((m: any) => m.courseId)
      .filter(Boolean) as any[];

    // Format prerequisites data
    const prerequisitesData = courses
      .filter((course) => course.prerequisites && course.prerequisites.length > 0)
      .map((course) => ({
        course: {
          id: course._id,
          code: course.code,
          name: course.name,
        },
        prerequisites: course.prerequisites,
      }));

    res.json({
      success: true,
      data: prerequisitesData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
