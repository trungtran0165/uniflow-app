import { Router } from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { enrollSchema, enrollmentIdSchema, studentIdSchema } from '../utils/validation.js';

const router = Router();

/**
 * GET /api/registration/open-classes
 * Lấy danh sách lớp đang mở cho đăng ký
 */
router.get('/open-classes', registrationController.getOpenClasses);

/**
 * GET /api/registration/open-classes/search
 * Tìm kiếm lớp đang mở
 * Query params: keyword, faculty, credits, etc.
 */
router.get('/open-classes/search', registrationController.searchOpenClasses);

/**
 * POST /api/registration/enroll
 * Đăng ký vào lớp
 * Body: { studentId, classId }
 */
router.post('/enroll', authenticate, validate(enrollSchema), registrationController.enroll);

/**
 * GET /api/registration/enrollments/:studentId
 * Lấy danh sách lớp đã đăng ký của sinh viên
 */
router.get('/enrollments/:studentId', authenticate, validate(studentIdSchema, 'params'), registrationController.getEnrollments);

/**
 * DELETE /api/registration/enrollments/:enrollmentId
 * Hủy đăng ký
 */
router.delete('/enrollments/:enrollmentId', authenticate, validate(enrollmentIdSchema, 'params'), registrationController.cancelEnrollment);

/**
 * GET /api/registration/summary/:studentId
 * Lấy tóm tắt đăng ký hiện tại (tín chỉ, tiến độ CTĐT)
 */
router.get('/summary/:studentId', authenticate, validate(studentIdSchema, 'params'), registrationController.getRegistrationSummary);

/**
 * GET /api/registration/history/:studentId
 * Lấy lịch sử đăng ký/hủy
 * Query params: action (register/cancel), result (success/failed)
 */
router.get('/history/:studentId', authenticate, validate(studentIdSchema, 'params'), registrationController.getRegistrationHistory);

export default router;
