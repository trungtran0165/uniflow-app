import { Request, Response } from 'express';
import Room from '../../models/Room.js';
import Class from '../../models/Class.js';

/**
 * Get all rooms
 */
export const getRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ code: 1 });

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create new room
 */
export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, building, capacity, roomType, facilities } = req.body;

    // Check if code already exists
    const existing = await Room.findOne({ code });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Room code already exists',
      });
      return;
    }

    const room = new Room({
      code,
      name,
      building,
      capacity,
      roomType: roomType || 'lecture',
      facilities: facilities || [],
    });

    await room.save();

    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get room by ID
 */
export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found',
      });
      return;
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update room
 */
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const updateData = req.body;

    const room = await Room.findByIdAndUpdate(
      roomId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found',
      });
      return;
    }

    res.json({
      success: true,
      data: room,
      message: 'Room updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete room
 */
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    // Check if room is being used
    const classesUsingRoom = await Class.countDocuments({
      'schedule.roomId': roomId,
    });

    if (classesUsingRoom > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete room. It is being used by ${classesUsingRoom} class(es)`,
      });
      return;
    }

    const room = await Room.findByIdAndUpdate(
      roomId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get room schedule (classes using this room)
 */
export const getRoomSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    const classes = await Class.find({
      'schedule.roomId': roomId,
    })
      .populate('courseId', 'code name')
      .populate('semesterId', 'name code')
      .populate('lecturerId', 'name')
      .select('code schedule');

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
