import { Request, Response } from 'express';
import Program from '../../models/Program.js';
import Course from '../../models/Course.js';
import AuditLog from '../../models/AuditLog.js';

/**
 * Get all programs
 */
export const getPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const programs = await Program.find().sort({ cohort: -1, major: 1 });

    res.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create new program
 */
export const createProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, system, cohort, major, majorLabel, html, version } = req.body;

    // Check if program already exists
    const existing = await Program.findOne({ code, system, cohort, major });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Program already exists',
      });
      return;
    }

    const program = new Program({
      code,
      name,
      system,
      cohort,
      major,
      majorLabel,
      html: html || '',
      version: version || '1.0',
    });

    await program.save();

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'CREATE_CLASS', // Using CREATE_CLASS for program creation
      resourceType: 'Program',
      resourceId: program._id,
      newValue: { code, name, system, cohort, major },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: program,
      message: 'Program created successfully',
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
 * Update program
 */
export const updateProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;
    const updateData = req.body;

    const oldProgram = await Program.findById(programId);

    const program = await Program.findByIdAndUpdate(
      programId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!program) {
      res.status(404).json({
        success: false,
        error: 'Program not found',
      });
      return;
    }

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'UPDATE_CLASS',
      resourceType: 'Program',
      resourceId: program._id,
      oldValue: oldProgram?.toObject(),
      newValue: updateData,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: program,
      message: 'Program updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete program (soft delete)
 */
export const deleteProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;

    const program = await Program.findByIdAndUpdate(
      programId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!program) {
      res.status(404).json({
        success: false,
        error: 'Program not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Program deleted successfully',
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

    const courses = await Course.find({ programId, isActive: true }).sort({ semester: 1, code: 1 });

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
 * Create course for a program
 */
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;
    const { code, name, credits, description, semester, isRequired, prerequisites } = req.body;

    // Verify program exists
    const program = await Program.findById(programId);
    if (!program) {
      res.status(404).json({
        success: false,
        error: 'Program not found',
      });
      return;
    }

    // Check if course already exists
    const existing = await Course.findOne({ code, programId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Course already exists',
      });
      return;
    }

    const course = new Course({
      code,
      name,
      credits,
      description: description || '',
      programId,
      semester,
      isRequired: isRequired !== undefined ? isRequired : true,
      prerequisites: prerequisites || [],
    });

    await course.save();

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'CREATE_CLASS',
      resourceType: 'Course',
      resourceId: course._id,
      newValue: { code, name, credits, programId, prerequisites },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update course
 */
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, courseId } = req.params;
    const updateData = req.body;

    const oldCourse = await Course.findOne({ _id: courseId, programId });

    const course = await Course.findOneAndUpdate(
      { _id: courseId, programId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found',
      });
      return;
    }

    // Audit log
    await AuditLog.create({
      userId: req.user!.id,
      action: 'UPDATE_CLASS',
      resourceType: 'Course',
      resourceId: course._id,
      oldValue: oldCourse?.toObject(),
      newValue: updateData,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete course
 */
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, courseId } = req.params;

    const course = await Course.findOneAndUpdate(
      { _id: courseId, programId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update program curriculum HTML
 */
export const updateCurriculum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId } = req.params;
    const { html } = req.body;

    const program = await Program.findByIdAndUpdate(
      programId,
      { $set: { html: html || '' } },
      { new: true }
    );

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
      message: 'Curriculum updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
