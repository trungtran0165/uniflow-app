import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule {
  dayOfWeek: number; // 0-6 (Chủ nhật = 0)
  period: string; // "1-3", "4-6", etc.
  roomId: mongoose.Types.ObjectId;
}

export interface IClass extends Document {
  code: string; // Mã lớp (CTDLGT202-01)
  courseId: mongoose.Types.ObjectId;
  semesterId: mongoose.Types.ObjectId;
  lecturerId: mongoose.Types.ObjectId;
  schedule: ISchedule[]; // Lịch học
  capacity: number; // Sĩ số tối đa
  enrolled: number; // Sĩ số hiện tại
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema: Schema = new Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    period: {
      type: String,
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
  },
  { _id: false }
);

const ClassSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    lecturerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schedule: [ScheduleSchema],
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    enrolled: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'cancelled'],
      default: 'draft',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ClassSchema.index({ code: 1 }, { unique: true });
ClassSchema.index({ courseId: 1, semesterId: 1 });
ClassSchema.index({ lecturerId: 1 });

// Compound index for room + time conflict detection
// Only applies when schedule array has at least one item
ClassSchema.index(
  { 
    'schedule.roomId': 1,
    'schedule.dayOfWeek': 1,
    'schedule.period': 1,
    semesterId: 1
  },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['open', 'draft'] },
      'schedule.0': { $exists: true } // Check if schedule array has at least one element
    },
    name: 'room_time_conflict'
  }
);

// Compound index for lecturer conflict detection
// Only applies when schedule array has at least one item
ClassSchema.index(
  {
    lecturerId: 1,
    'schedule.dayOfWeek': 1,
    'schedule.period': 1,
    semesterId: 1
  },
  {
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['open', 'draft'] },
      'schedule.0': { $exists: true } // Check if schedule array has at least one element
    },
    name: 'lecturer_time_conflict'
  }
);

export default mongoose.model<IClass>('Class', ClassSchema);
