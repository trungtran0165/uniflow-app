import { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeSelfOrAdmin } from '../middleware/authorize.js';

const router = Router();

/**
 * GET /api/students/:studentId/dashboard
 * Lấy thống kê dashboard cho sinh viên
 */
router.get('/:studentId/dashboard', authenticate, authorizeSelfOrAdmin, studentController.getDashboard);

/**
 * GET /api/students/:studentId/transcript
 * Lấy bảng điểm theo học kỳ
 */
router.get('/:studentId/transcript', authenticate, authorizeSelfOrAdmin, studentController.getTranscript);

/**
 * GET /api/students/:studentId/transcript/summary
 * Lấy tổng hợp bảng điểm (GPA tích lũy, tín chỉ tích lũy)
 */
router.get('/:studentId/transcript/summary', authenticate, authorizeSelfOrAdmin, studentController.getTranscriptSummary);

/**
 * GET /api/students/:studentId/transcript/export
 * Export bảng điểm ra PDF
 */
router.get('/:studentId/transcript/export', authenticate, authorizeSelfOrAdmin, studentController.exportTranscript);

/**
 * GET /api/students/:studentId/timetable/changes
 * Lấy thông tin thay đổi lịch học (đổi phòng, học bù, hủy)
 * NOTE: This route must be defined BEFORE /:studentId/timetable/:week to avoid route conflict
 */
router.get('/:studentId/timetable/changes', authenticate, authorizeSelfOrAdmin, studentController.getScheduleChanges);

/**
 * GET /api/students/:studentId/timetable/:week
 * Lấy thời khóa biểu theo tuần cụ thể
 * NOTE: This route must be defined BEFORE /:studentId/timetable to avoid route conflict
 */
router.get('/:studentId/timetable/:week', authenticate, authorizeSelfOrAdmin, studentController.getTimetableByWeek);

/**
 * GET /api/students/:studentId/timetable
 * Lấy thời khóa biểu hiện tại
 */
router.get('/:studentId/timetable', authenticate, authorizeSelfOrAdmin, studentController.getTimetable);

export default router;
