import { Request, Response } from 'express';
import RegistrationWindow from '../../models/RegistrationWindow.js';
import Semester from '../../models/Semester.js';

/**
 * Get all registration windows
 */
export const getRegistrationWindows = async (req: Request, res: Response): Promise<void> => {
  try {
    const windows = await RegistrationWindow.find()
      .populate('semesterId', 'name code')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: windows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create new registration window
 */
export const createRegistrationWindow = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      semesterId,
      startDate,
      endDate,
      minCredits,
      maxCredits,
      targetCohorts,
      targetMajors,
      rules,
    } = req.body;

    // Verify semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      res.status(404).json({
        success: false,
        error: 'Semester not found',
      });
      return;
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      res.status(400).json({
        success: false,
        error: 'End date must be after start date',
      });
      return;
    }

    const window = new RegistrationWindow({
      name,
      semesterId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      minCredits,
      maxCredits,
      targetCohorts: targetCohorts || [],
      targetMajors: targetMajors || [],
      rules: {
        checkPrerequisites: rules?.checkPrerequisites !== false,
        checkScheduleConflict: rules?.checkScheduleConflict !== false,
        checkCreditLimit: rules?.checkCreditLimit !== false,
        allowWaitlist: rules?.allowWaitlist !== false,
      },
      status: 'draft',
    });

    await window.save();

    const populated = await RegistrationWindow.findById(window._id).populate('semesterId', 'name code');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Registration window created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get registration window by ID
 */
export const getRegistrationWindowById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { windowId } = req.params;

    const window = await RegistrationWindow.findById(windowId).populate('semesterId', 'name code');

    if (!window) {
      res.status(404).json({
        success: false,
        error: 'Registration window not found',
      });
      return;
    }

    res.json({
      success: true,
      data: window,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update registration window
 */
export const updateRegistrationWindow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { windowId } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects if present
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const window = await RegistrationWindow.findByIdAndUpdate(
      windowId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('semesterId', 'name code');

    if (!window) {
      res.status(404).json({
        success: false,
        error: 'Registration window not found',
      });
      return;
    }

    res.json({
      success: true,
      data: window,
      message: 'Registration window updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update registration window status (open/close)
 */
export const updateRegistrationWindowStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { windowId } = req.params;
    const { status } = req.body;

    if (!['draft', 'open', 'closed'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: draft, open, or closed',
      });
      return;
    }

    const window = await RegistrationWindow.findByIdAndUpdate(
      windowId,
      { $set: { status } },
      { new: true }
    ).populate('semesterId', 'name code');

    if (!window) {
      res.status(404).json({
        success: false,
        error: 'Registration window not found',
      });
      return;
    }

    res.json({
      success: true,
      data: window,
      message: `Registration window ${status} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete registration window
 */
export const deleteRegistrationWindow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { windowId } = req.params;

    const window = await RegistrationWindow.findByIdAndDelete(windowId);

    if (!window) {
      res.status(404).json({
        success: false,
        error: 'Registration window not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Registration window deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
