import { Router } from 'express';
import * as classController from '../../controllers/admin/classController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { classIdSchema, createClassSchema, updateClassSchema } from '../../utils/validation.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/classes
 * Get all classes
 */
router.get('/', classController.getClasses);

/**
 * POST /api/admin/classes
 * Create new class
 */
router.post('/', validate(createClassSchema), classController.createClass);

/**
 * GET /api/admin/classes/:classId
 * Get class by ID
 */
router.get('/:classId', validate(classIdSchema, 'params'), classController.getClassById);

/**
 * PUT /api/admin/classes/:classId
 * Update class
 */
router.put('/:classId', validate(classIdSchema, 'params'), validate(updateClassSchema), classController.updateClass);

/**
 * DELETE /api/admin/classes/:classId
 * Delete class
 */
router.delete('/:classId', validate(classIdSchema, 'params'), classController.deleteClass);

/**
 * GET /api/admin/classes/:classId/students
 * Get students in a class
 */
router.get('/:classId/students', validate(classIdSchema, 'params'), classController.getClassStudents);

export default router;
