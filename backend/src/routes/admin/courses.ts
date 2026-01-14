import { Router } from 'express';
import * as courseController from '../../controllers/admin/courseController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { courseIdParamSchema } from '../../utils/validation.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/courses
 */
router.get('/', courseController.getCourses);

/**
 * POST /api/admin/courses
 */
router.post('/', courseController.createCourse);

/**
 * PUT /api/admin/courses/:courseId
 */
router.put('/:courseId', validate(courseIdParamSchema, 'params'), courseController.updateCourse);

/**
 * DELETE /api/admin/courses/:courseId
 */
router.delete('/:courseId', validate(courseIdParamSchema, 'params'), courseController.deleteCourse);

export default router;


