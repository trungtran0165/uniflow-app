import { Router } from 'express';
import * as studentController from '../../controllers/admin/studentController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/students
 * Get all students (admin dashboard)
 */
router.get('/', studentController.getStudents);

/**
 * POST /api/admin/students
 * Create student
 */
router.post('/', studentController.createStudent);

/**
 * POST /api/admin/students/bulk
 * Bulk create students
 */
router.post('/bulk', studentController.bulkCreateStudents);

/**
 * PUT /api/admin/students/:studentId
 * Update student
 */
router.put('/:studentId', studentController.updateStudent);

/**
 * DELETE /api/admin/students/:studentId
 * Delete student
 */
router.delete('/:studentId', studentController.deleteStudent);

export default router;

