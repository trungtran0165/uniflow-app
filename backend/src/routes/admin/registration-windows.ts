import { Router } from 'express';
import * as registrationWindowController from '../../controllers/admin/registrationWindowController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createRegistrationWindowSchema,
  updateRegistrationWindowSchema,
  windowIdSchema,
  updateStatusSchema,
} from '../../utils/validation.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * GET /api/admin/registration-windows
 * Get all registration windows
 */
router.get('/', registrationWindowController.getRegistrationWindows);

/**
 * POST /api/admin/registration-windows
 * Create new registration window
 */
router.post('/', validate(createRegistrationWindowSchema), registrationWindowController.createRegistrationWindow);

/**
 * GET /api/admin/registration-windows/:windowId
 * Get registration window by ID
 */
router.get('/:windowId', validate(windowIdSchema, 'params'), registrationWindowController.getRegistrationWindowById);

/**
 * PUT /api/admin/registration-windows/:windowId
 * Update registration window
 */
router.put('/:windowId', validate(windowIdSchema, 'params'), validate(updateRegistrationWindowSchema), registrationWindowController.updateRegistrationWindow);

/**
 * PATCH /api/admin/registration-windows/:windowId/status
 * Update registration window status (open/close)
 */
router.patch('/:windowId/status', validate(windowIdSchema, 'params'), validate(updateStatusSchema), registrationWindowController.updateRegistrationWindowStatus);

/**
 * DELETE /api/admin/registration-windows/:windowId
 * Delete registration window
 */
router.delete('/:windowId', validate(windowIdSchema, 'params'), registrationWindowController.deleteRegistrationWindow);

export default router;
