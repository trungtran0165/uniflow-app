import { Router } from 'express';
import * as roomController from '../../controllers/admin/roomController.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../utils/validation.js';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

const createRoomSchema = z.object({
  code: z.string().min(1, 'Room code is required'),
  name: z.string().min(1, 'Room name is required'),
  building: z.string().min(1, 'Building is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  roomType: z.enum(['lecture', 'lab', 'seminar', 'other']).optional(),
  facilities: z.array(z.string()).optional(),
});

const updateRoomSchema = createRoomSchema.partial();

/**
 * GET /api/admin/rooms
 * Get all rooms
 */
router.get('/', roomController.getRooms);

/**
 * POST /api/admin/rooms
 * Create new room
 */
router.post('/', validate(createRoomSchema), roomController.createRoom);

/**
 * GET /api/admin/rooms/:roomId
 * Get room by ID
 */
router.get('/:roomId', validate(idParamSchema, 'params'), roomController.getRoomById);

/**
 * PUT /api/admin/rooms/:roomId
 * Update room
 */
router.put('/:roomId', validate(idParamSchema, 'params'), validate(updateRoomSchema), roomController.updateRoom);

/**
 * DELETE /api/admin/rooms/:roomId
 * Delete room
 */
router.delete('/:roomId', validate(idParamSchema, 'params'), roomController.deleteRoom);

/**
 * GET /api/admin/rooms/:roomId/schedule
 * Get room schedule
 */
router.get('/:roomId/schedule', validate(idParamSchema, 'params'), roomController.getRoomSchedule);

export default router;
