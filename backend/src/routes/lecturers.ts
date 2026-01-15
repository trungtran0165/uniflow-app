import { Router } from 'express';
import * as lecturerController from '../controllers/lecturerController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { classIdSchema, updateGradeSchema } from '../utils/validation.js';

const router = Router();

// All lecturer routes require authentication
router.use(authenticate);

/**
 * GET /api/lecturers/:lecturerId/classes
 * Get lecturer's classes
 */
router.get('/:lecturerId/classes', lecturerController.getLecturerClasses);

/**
 * GET /api/lecturers/:lecturerId/classes/:classId
 * Get class details
 */
router.get('/:lecturerId/classes/:classId', validate(classIdSchema, 'params'), lecturerController.getClassDetails);

/**
 * GET /api/lecturers/:lecturerId/classes/:classId/students
 * Get students in a class
 */
router.get('/:lecturerId/classes/:classId/students', validate(classIdSchema, 'params'), lecturerController.getClassStudents);

/**
 * GET /api/lecturers/:lecturerId/classes/:classId/grades
 * Get grades for a class
 */
router.get('/:lecturerId/classes/:classId/grades', validate(classIdSchema, 'params'), lecturerController.getClassGrades);

/**
 * PUT /api/lecturers/:lecturerId/classes/:classId/grades/:studentId
 * Update grade for a student
 */
router.put('/:lecturerId/classes/:classId/grades/:studentId', validate(classIdSchema, 'params'), validate(updateGradeSchema), lecturerController.updateGrade);

/**
 * POST /api/lecturers/:lecturerId/classes/:classId/grades/bulk
 * Bulk update grades
 */
router.post('/:lecturerId/classes/:classId/grades/bulk', validate(classIdSchema, 'params'), lecturerController.bulkUpdateGrades);

/**
 * GET /api/lecturers/:lecturerId/classes/:classId/grades/template
 * Get grade template (for Excel export)
 */
router.get('/:lecturerId/classes/:classId/grades/template', validate(classIdSchema, 'params'), lecturerController.getGradeTemplate);

export default router;
