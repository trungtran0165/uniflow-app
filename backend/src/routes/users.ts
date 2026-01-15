import { Router, Request, Response } from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

/**
 * GET /api/users - Lấy danh sách users (cần auth)
 * GET /api/users/lecturers - Lấy danh sách giảng viên
 */
router.get('/lecturers', authenticate, async (req: Request, res: Response) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' }).select('-__v -password');
    res.json({ success: true, data: lecturers });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/users - Lấy danh sách users
router.get('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-__v');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/users/:id - Lấy user theo ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// POST /api/users - Tạo user mới
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { email, name, role } = req.body;
    
    if (!email || !name || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: email, name, role' 
      });
    }

    const user = new User({ email, name, role });
    await user.save();
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(409).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
