import { Router } from 'express';
import * as programController from '../../controllers/admin/programController.js';
import * as programCourseController from '../../controllers/admin/programCourseController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createProgramSchema,
  updateProgramSchema,
  programIdSchema,
  courseIdParamSchema,
} from '../../utils/validation.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/programs
 * Get all programs
 */
router.get('/', programController.getPrograms);

/**
 * POST /api/admin/programs
 * Create new program
 */
router.post('/', validate(createProgramSchema), programController.createProgram);

/**
 * GET /api/admin/programs/:programId
 * Get program by ID
 */
router.get('/:programId', validate(programIdSchema, 'params'), programController.getProgramById);

/**
 * PUT /api/admin/programs/:programId
 * Update program
 */
router.put('/:programId', validate(programIdSchema, 'params'), validate(updateProgramSchema), programController.updateProgram);

/**
 * DELETE /api/admin/programs/:programId
 * Delete program
 */
router.delete('/:programId', validate(programIdSchema, 'params'), programController.deleteProgram);

/**
 * GET /api/admin/programs/:programId/courses
 * Get courses for a program
 */
router.get('/:programId/courses', validate(programIdSchema, 'params'), programController.getProgramCourses);

/**
 * GET /api/admin/programs/:programId/curriculum
 * Get curriculum mappings for a program (ProgramCourse)
 */
router.get('/:programId/curriculum', validate(programIdSchema, 'params'), programCourseController.getProgramCurriculum);

/**
 * POST /api/admin/programs/:programId/curriculum
 * Add existing course into program (ProgramCourse)
 */
router.post('/:programId/curriculum', validate(programIdSchema, 'params'), programCourseController.addCourseToProgram);

/**
 * PUT /api/admin/programs/:programId/curriculum/:programCourseId
 */
router.put(
  '/:programId/curriculum/:programCourseId',
  validate(programIdSchema, 'params'),
  programCourseController.updateProgramCourse
);

/**
 * DELETE /api/admin/programs/:programId/curriculum/:programCourseId
 */
router.delete(
  '/:programId/curriculum/:programCourseId',
  validate(programIdSchema, 'params'),
  programCourseController.removeCourseFromProgram
);

/**
 * POST /api/admin/programs/:programId/courses
 * Create course for a program
 */
router.post('/:programId/courses', validate(programIdSchema, 'params'), programController.createCourse);

/**
 * PUT /api/admin/programs/:programId/courses/:courseId
 * Update course
 */
router.put('/:programId/courses/:courseId', validate(programIdSchema, 'params'), validate(courseIdParamSchema, 'params'), programController.updateCourse);

/**
 * DELETE /api/admin/programs/:programId/courses/:courseId
 * Delete course
 */
router.delete('/:programId/courses/:courseId', validate(programIdSchema, 'params'), validate(courseIdParamSchema, 'params'), programController.deleteCourse);

/**
 * PUT /api/admin/programs/:programId/curriculum
 * Update program curriculum HTML
 */
router.put('/:programId/curriculum', validate(programIdSchema, 'params'), programController.updateCurriculum);

export default router;
