import { Router } from 'express';
import * as semesterController from '../../controllers/admin/semesterController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { semesterIdSchema, idParamSchema } from '../../utils/validation.js';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

const createSemesterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  type: z.enum(['HK1', 'HK2', 'HKHe']),
  startDate: z.union([z.string().datetime(), z.string()]),
  endDate: z.union([z.string().datetime(), z.string()]),
});

const updateSemesterSchema = createSemesterSchema.partial();

/**
 * GET /api/admin/semesters
 * Get all semesters
 */
router.get('/', semesterController.getSemesters);

/**
 * POST /api/admin/semesters
 * Create new semester
 */
router.post('/', validate(createSemesterSchema), semesterController.createSemester);

/**
 * GET /api/admin/semesters/:semesterId
 * Get semester by ID
 */
router.get('/:semesterId', validate(semesterIdSchema, 'params'), semesterController.getSemesterById);

/**
 * PUT /api/admin/semesters/:semesterId
 * Update semester
 */
router.put('/:semesterId', validate(semesterIdSchema, 'params'), validate(updateSemesterSchema), semesterController.updateSemester);

/**
 * DELETE /api/admin/semesters/:semesterId
 * Delete semester
 */
router.delete('/:semesterId', validate(semesterIdSchema, 'params'), semesterController.deleteSemester);

export default router;
