import { Request, Response } from 'express';
import RegistrationWindow from '../../models/RegistrationWindow.js';
import Semester from '../../models/Semester.js';
import Class from '../../models/Class.js';

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
      classIds,
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
      classIds: classIds || [],
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

    // Normalize classIds
    if (updateData.classIds && !Array.isArray(updateData.classIds)) {
      updateData.classIds = [];
    }

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

    // If window is currently open and classIds were updated, auto-open selected draft classes
    if (window.status === 'open' && Array.isArray(updateData.classIds) && updateData.classIds.length > 0) {
      await Class.updateMany(
        {
          _id: { $in: updateData.classIds },
          status: 'draft',
        },
        { $set: { status: 'open' } }
      );
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

    // Ensure only one window is open at a time
    if (status === 'open') {
      const anyOtherOpen = await RegistrationWindow.findOne({
        _id: { $ne: windowId },
        status: 'open',
      });
      if (anyOtherOpen) {
        res.status(409).json({
          success: false,
          error: 'Another registration window is already open. Please close it before opening this one.',
        });
        return;
      }
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

    // Convenience: when opening a window, auto-publish classes
    // - If window has classIds configured: auto-open only those (ignore semesterId, allow no-schedule)
    // - Else: auto-open all scheduled draft classes in the semester
    let autoOpenedClasses = 0;
    if (status === 'open') {
      const hasExplicitList = Array.isArray((window as any).classIds) && (window as any).classIds.length > 0;
      const filter: any = { status: 'draft' };
      if (hasExplicitList) filter._id = { $in: (window as any).classIds };
      else {
        filter.semesterId = window.semesterId;
        filter['schedule.0'] = { $exists: true };
      }

      const result = await Class.updateMany(filter, { $set: { status: 'open' } });
      autoOpenedClasses = (result as any).modifiedCount ?? (result as any).nModified ?? 0;
    }

    res.json({
      success: true,
      data: window,
      message:
        status === 'open'
          ? `Registration window opened successfully (auto-opened ${autoOpenedClasses} classes)`
          : `Registration window ${status} successfully`,
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
