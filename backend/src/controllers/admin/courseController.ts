import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Course from '../../models/Course.js';
import Program from '../../models/Program.js';

/**
 * GET /api/admin/courses
 * Optional query:
 *  - programId: filter by program
 *  - unassigned=true: only courses without programId
 *  - keyword: search by code/name
 */
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, unassigned, keyword } = req.query as {
      programId?: string;
      unassigned?: string;
      keyword?: string;
    };

    const filter: any = { isActive: true };

    if (unassigned === 'true') {
      filter.$or = [{ programId: { $exists: false } }, { programId: null }];
    } else if (programId) {
      filter.programId = programId;
    }

    if (keyword && keyword.trim()) {
      const q = keyword.trim();
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ code: { $regex: q, $options: 'i' } }, { name: { $regex: q, $options: 'i' } }],
      });
    }

    const courses = await Course.find(filter)
      .populate('programId', 'code name cohort major majorLabel system')
      .populate('prerequisites', 'code name')
      .sort({ code: 1 });

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/admin/courses
 * Create a course in global catalog (programId optional)
 */
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, credits, theoryCredits, practiceCredits, description, programId, semester, isRequired, prerequisites, isGeneral } = req.body;

    if (!code || !name || !credits) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: code, name, credits',
      });
      return;
    }

    // Enforce unique code at API level (avoid DB unique index migration issues)
    const existingByCode = await Course.findOne({ code: String(code).toUpperCase().trim(), isActive: true });
    if (existingByCode) {
      res.status(409).json({
        success: false,
        error: 'Course code already exists',
      });
      return;
    }

    if (programId && !mongoose.Types.ObjectId.isValid(programId)) {
      res.status(400).json({
        success: false,
        error: 'programId must be a valid ObjectId',
      });
      return;
    }

    if (programId) {
      const program = await Program.findById(programId);
      if (!program) {
        res.status(404).json({ success: false, error: 'Program not found' });
        return;
      }
    }

    const totalCredits = Number(credits);
    const t = theoryCredits !== undefined ? Number(theoryCredits) : totalCredits;
    const p = practiceCredits !== undefined ? Number(practiceCredits) : 0;

    if (!Number.isFinite(totalCredits) || totalCredits < 1) {
      res.status(400).json({ success: false, error: 'credits must be a number >= 1' });
      return;
    }
    if (!Number.isFinite(t) || t < 0 || !Number.isFinite(p) || p < 0) {
      res.status(400).json({ success: false, error: 'theoryCredits/practiceCredits must be numbers >= 0' });
      return;
    }
    if (t + p !== totalCredits) {
      res.status(400).json({
        success: false,
        error: 'credits must equal theoryCredits + practiceCredits',
        details: { credits: totalCredits, theoryCredits: t, practiceCredits: p },
      });
      return;
    }

    const course = await Course.create({
      code,
      name,
      credits: totalCredits,
      theoryCredits: t,
      practiceCredits: p,
      description: description || '',
      programId: programId || undefined,
      semester: semester || 1,
      isRequired: isRequired !== undefined ? isRequired : true,
      isGeneral: isGeneral === true,
      prerequisites: prerequisites || [],
    });

    const populated = await Course.findById(course._id)
      .populate('programId', 'code name cohort major majorLabel system')
      .populate('prerequisites', 'code name');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * PUT /api/admin/courses/:courseId
 * Update course (including assigning to programId and prerequisites)
 */
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const updateData = req.body || {};

    // Validate credits split if any of these fields is present
    if (
      updateData.credits !== undefined ||
      updateData.theoryCredits !== undefined ||
      updateData.practiceCredits !== undefined
    ) {
      const current = await Course.findById(courseId).select('credits theoryCredits practiceCredits');
      if (!current) {
        res.status(404).json({ success: false, error: 'Course not found' });
        return;
      }

      const mergedCredits = updateData.credits !== undefined ? Number(updateData.credits) : Number(current.credits);
      const mergedTheory =
        updateData.theoryCredits !== undefined ? Number(updateData.theoryCredits) : Number((current as any).theoryCredits ?? current.credits);
      const mergedPractice =
        updateData.practiceCredits !== undefined ? Number(updateData.practiceCredits) : Number((current as any).practiceCredits ?? 0);

      if (!Number.isFinite(mergedCredits) || mergedCredits < 1) {
        res.status(400).json({ success: false, error: 'credits must be a number >= 1' });
        return;
      }
      if (!Number.isFinite(mergedTheory) || mergedTheory < 0 || !Number.isFinite(mergedPractice) || mergedPractice < 0) {
        res.status(400).json({ success: false, error: 'theoryCredits/practiceCredits must be numbers >= 0' });
        return;
      }
      if (mergedTheory + mergedPractice !== mergedCredits) {
        res.status(400).json({
          success: false,
          error: 'credits must equal theoryCredits + practiceCredits',
          details: { credits: mergedCredits, theoryCredits: mergedTheory, practiceCredits: mergedPractice },
        });
        return;
      }

      updateData.credits = mergedCredits;
      updateData.theoryCredits = mergedTheory;
      updateData.practiceCredits = mergedPractice;
    }

    if (updateData.code) {
      const normalized = String(updateData.code).toUpperCase().trim();
      const existingByCode = await Course.findOne({
        _id: { $ne: courseId },
        code: normalized,
        isActive: true,
      });
      if (existingByCode) {
        res.status(409).json({
          success: false,
          error: 'Course code already exists',
        });
        return;
      }
      updateData.code = normalized;
    }

    if (updateData.programId && !mongoose.Types.ObjectId.isValid(updateData.programId)) {
      res.status(400).json({
        success: false,
        error: 'programId must be a valid ObjectId',
      });
      return;
    }

    if (updateData.programId) {
      const program = await Program.findById(updateData.programId);
      if (!program) {
        res.status(404).json({ success: false, error: 'Program not found' });
        return;
      }
    }

    const course = await Course.findByIdAndUpdate(courseId, { $set: updateData }, { new: true, runValidators: true })
      .populate('programId', 'code name cohort major majorLabel system')
      .populate('prerequisites', 'code name');

    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    res.json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * DELETE /api/admin/courses/:courseId
 * Soft delete
 */
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndUpdate(courseId, { $set: { isActive: false } }, { new: true });
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};


