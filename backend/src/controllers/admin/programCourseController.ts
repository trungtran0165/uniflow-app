import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Program from '../../models/Program.js';
import Course from '../../models/Course.js';
import ProgramCourse from '../../models/ProgramCourse.js';

/**
 * GET /api/admin/programs/:programId/curriculum
 * List course mappings for a program
 */
export const getProgramCurriculum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }

    const mappings = await ProgramCourse.find({ programId, isActive: true })
      .populate('courseId')
      .sort({ category: 1, recommendedSemester: 1, createdAt: 1 });

    res.json({ success: true, data: mappings });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/admin/programs/:programId/curriculum
 * Body: { courseId, category, recommendedSemester?, electiveGroup? }
 */
export const addCourseToProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;
    const { courseId, category, recommendedSemester, electiveGroup } = req.body as {
      courseId?: string;
      category?: 'core' | 'required' | 'elective';
      recommendedSemester?: number;
      electiveGroup?: string;
    };

    if (!courseId || !category) {
      res.status(400).json({ success: false, error: 'courseId and category are required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(programId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ success: false, error: 'programId/courseId must be valid ObjectId' });
      return;
    }

    const program = await Program.findById(programId);
    if (!program) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    const mapping = await ProgramCourse.create({
      programId,
      courseId,
      category,
      recommendedSemester,
      electiveGroup: electiveGroup || '',
      isActive: true,
    });

    const populated = await ProgramCourse.findById(mapping._id).populate('courseId');
    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, error: 'Course already exists in this program' });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/admin/programs/:programId/curriculum/:programCourseId
 * Update mapping
 */
export const updateProgramCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, programCourseId } = req.params;
    const updateData = req.body || {};

    const mapping = await ProgramCourse.findOneAndUpdate(
      { _id: programCourseId, programId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('courseId');

    if (!mapping) {
      res.status(404).json({ success: false, error: 'ProgramCourse not found' });
      return;
    }

    res.json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * DELETE /api/admin/programs/:programId/curriculum/:programCourseId
 * Soft delete mapping
 */
export const removeCourseFromProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, programCourseId } = req.params;

    const mapping = await ProgramCourse.findOneAndUpdate(
      { _id: programCourseId, programId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!mapping) {
      res.status(404).json({ success: false, error: 'ProgramCourse not found' });
      return;
    }

    res.json({ success: true, message: 'Removed from program' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};



