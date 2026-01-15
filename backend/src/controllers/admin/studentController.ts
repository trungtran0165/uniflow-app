import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Student from '../../models/Student.js';
import User from '../../models/User.js';
import Program from '../../models/Program.js';
import { createMoodleUserOnly } from '../../services/moodleService.js';

/**
 * GET /api/admin/students
 * Optional query:
 *  - programId: filter by program
 *  - keyword: search by MSSV or user name/email
 */
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, keyword } = req.query as { programId?: string; keyword?: string };

    const filter: any = {};
    if (programId) {
      filter.programId = programId;
    }

    let students = await Student.find(filter)
      .populate('userId', 'name email')
      .populate('programId', 'code name cohort major majorLabel system')
      .sort({ studentId: 1 });

    if (keyword && keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      students = students.filter((s: any) => {
        const studentId = (s.studentId || '').toLowerCase();
        const name = (s.userId?.name || '').toLowerCase();
        const email = (s.userId?.email || '').toLowerCase();
        return studentId.includes(q) || name.includes(q) || email.includes(q);
      });
    }

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
 * POST /api/admin/students
 * Create student + user
 */
export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentId,
      name,
      email,
      password,
      programId,
      programCode,
      cohort,
      major,
      status,
    } = req.body as {
      studentId?: string;
      name?: string;
      email?: string;
      password?: string;
      programId?: string;
      programCode?: string;
      cohort?: string;
      major?: string;
      status?: 'active' | 'graduated' | 'suspended' | 'dropped';
    };

    if (!studentId || !name || !email) {
      res.status(400).json({
        success: false,
        error: 'studentId, name, email are required',
      });
      return;
    }

    let program: any = null;
    if (programId) {
      if (!mongoose.Types.ObjectId.isValid(programId)) {
        res.status(400).json({ success: false, error: 'programId must be a valid ObjectId' });
        return;
      }
      program = await Program.findById(programId);
    } else if (programCode) {
      program = await Program.findOne({ code: programCode });
    }

    if (!program) {
      res.status(400).json({
        success: false,
        error: 'Program not found. Please provide a valid programId or programCode.',
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'Email already exists' });
      return;
    }

    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      res.status(409).json({ success: false, error: 'studentId already exists' });
      return;
    }

    const rawPassword = password?.trim() || '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const user = await User.create({
      email: normalizedEmail,
      name: name.trim(),
      password: hashedPassword,
      role: 'student',
    });

    const student = await Student.create({
      userId: user._id,
      studentId: String(studentId).trim(),
      programId: program._id,
      cohort: cohort || program.cohort,
      major: major || program.major,
      status: status || 'active',
    });

    const populated = await Student.findById(student._id)
      .populate('userId', 'name email')
      .populate('programId', 'code name cohort major majorLabel system');

    // Auto-create Moodle user (async, don't block response)
    createMoodleUserOnly({
      studentId: String(studentId).trim(),
      email: normalizedEmail,
      name: name.trim(),
    }).catch(error => {
      console.error('Failed to create Moodle user (async):', error);
      // Don't fail the request, just log the error
    });

    res.status(201).json({
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
 * PUT /api/admin/students/:studentId
 * Update student + user info
 */
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const updateData = req.body || {};

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    let program: any = null;
    if (updateData.programId || updateData.programCode) {
      if (updateData.programId) {
        if (!mongoose.Types.ObjectId.isValid(updateData.programId)) {
          res.status(400).json({ success: false, error: 'programId must be a valid ObjectId' });
          return;
        }
        program = await Program.findById(updateData.programId);
      } else if (updateData.programCode) {
        program = await Program.findOne({ code: updateData.programCode });
      }
      if (!program) {
        res.status(400).json({ success: false, error: 'Program not found' });
        return;
      }
      updateData.programId = program._id;
      if (!updateData.cohort) updateData.cohort = program.cohort;
      if (!updateData.major) updateData.major = program.major;
    }

    // Update user fields if provided
    if (updateData.name || updateData.email || updateData.password) {
      const userUpdate: any = {};
      if (updateData.name) userUpdate.name = updateData.name.trim();
      if (updateData.email) userUpdate.email = String(updateData.email).toLowerCase().trim();
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        userUpdate.password = await bcrypt.hash(updateData.password.trim(), salt);
      }
      await User.findByIdAndUpdate(student.userId, { $set: userUpdate });
    }

    const updated = await Student.findByIdAndUpdate(
      studentId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email')
      .populate('programId', 'code name cohort major majorLabel system');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * DELETE /api/admin/students/:studentId
 * Delete student + user
 */
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    await Student.findByIdAndDelete(studentId);
    await User.findByIdAndDelete(student.userId);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * POST /api/admin/students/bulk
 * Bulk create students
 */
export const bulkCreateStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { students } = req.body as { students?: any[] };
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, error: 'students array is required' });
      return;
    }

    const results = await Promise.allSettled(
      students.map(async (item) => {
        const {
          studentId,
          name,
          email,
          password,
          programId,
          programCode,
          cohort,
          major,
          status,
        } = item || {};

        if (!studentId || !name || !email) {
          throw new Error('studentId, name, email are required');
        }

        let program: any = null;
        if (programId) {
          if (!mongoose.Types.ObjectId.isValid(programId)) {
            throw new Error('programId must be a valid ObjectId');
          }
          program = await Program.findById(programId);
        } else if (programCode) {
          program = await Program.findOne({ code: programCode });
        }

        if (!program) {
          throw new Error('Program not found');
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          throw new Error('Email already exists');
        }

        const existingStudent = await Student.findOne({ studentId });
        if (existingStudent) {
          throw new Error('studentId already exists');
        }

        const rawPassword = String(password || '123456');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const user = await User.create({
          email: normalizedEmail,
          name: String(name).trim(),
          password: hashedPassword,
          role: 'student',
        });

        const student = await Student.create({
          userId: user._id,
          studentId: String(studentId).trim(),
          programId: program._id,
          cohort: cohort || program.cohort,
          major: major || program.major,
          status: status || 'active',
        });

        return student._id;
      })
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    const success = results.length - failed;

    res.json({
      success: failed === 0,
      data: { success, failed },
      errors: results
        .map((r, idx) => (r.status === 'rejected' ? { index: idx, error: (r.reason as Error).message } : null))
        .filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

