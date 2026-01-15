import { Request, Response } from 'express';
import Semester from '../../models/Semester.js';

/**
 * Get all semesters
 */
export const getSemesters = async (req: Request, res: Response): Promise<void> => {
  try {
    const semesters = await Semester.find().sort({ startDate: -1 });

    res.json({
      success: true,
      data: semesters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create new semester
 */
export const createSemester = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, academicYear, type, startDate, endDate, isActive } = req.body;

    // Check if code already exists
    const existing = await Semester.findOne({ code });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Semester code already exists',
      });
      return;
    }

    const nextIsActive = typeof isActive === 'boolean' ? isActive : true;

    const semester = new Semester({
      name,
      code,
      academicYear,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: nextIsActive,
    });

    await semester.save();

    // Ensure only one active semester
    if (semester.isActive) {
      await Semester.updateMany({ _id: { $ne: semester._id } }, { $set: { isActive: false } });
    }

    res.status(201).json({
      success: true,
      data: semester,
      message: 'Semester created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get semester by ID
 */
export const getSemesterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      res.status(404).json({
        success: false,
        error: 'Semester not found',
      });
      return;
    }

    res.json({
      success: true,
      data: semester,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update semester
 */
export const updateSemester = async (req: Request, res: Response): Promise<void> => {
  try {
    const { semesterId } = req.params;
    const updateData = req.body;

    // Convert dates if present
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const semester = await Semester.findByIdAndUpdate(
      semesterId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!semester) {
      res.status(404).json({
        success: false,
        error: 'Semester not found',
      });
      return;
    }

    // Ensure only one active semester
    if (updateData.isActive === true) {
      await Semester.updateMany({ _id: { $ne: semester._id } }, { $set: { isActive: false } });
    }

    res.json({
      success: true,
      data: semester,
      message: 'Semester updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete semester
 */
export const deleteSemester = async (req: Request, res: Response): Promise<void> => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findByIdAndDelete(semesterId);

    if (!semester) {
      res.status(404).json({
        success: false,
        error: 'Semester not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Semester deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
