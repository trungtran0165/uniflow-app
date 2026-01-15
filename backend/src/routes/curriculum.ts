import { Router } from 'express';
import * as curriculumController from '../controllers/curriculumController.js';

const router = Router();

/**
 * GET /api/curriculum/programs
 * Lấy danh sách chương trình đào tạo
 * Query params: system (chinh-quy/tu-xa), cohort, major
 */
router.get('/programs', curriculumController.getPrograms);

/**
 * GET /api/curriculum/programs/:programId
 * Lấy chi tiết chương trình đào tạo
 */
router.get('/programs/:programId', curriculumController.getProgramById);

/**
 * GET /api/curriculum/programs/:programId/courses
 * Lấy danh mục học phần của chương trình
 */
router.get('/programs/:programId/courses', curriculumController.getProgramCourses);

/**
 * GET /api/curriculum/programs/:programId/prerequisites
 * Lấy điều kiện tiên quyết của các học phần
 */
router.get('/programs/:programId/prerequisites', curriculumController.getProgramPrerequisites);

export default router;
