import mongoose, { Schema, Document } from 'mongoose';

export interface IGrade extends Document {
  enrollmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  midtermScore?: number; // Điểm quá trình
  finalScore?: number; // Điểm cuối kỳ
  otherScores: {
    name: string;
    score: number;
    weight: number; // %
  }[];
  finalGrade: number; // Điểm tổng kết
  letterGrade: string; // A, B, C, D, F
  isLocked: boolean; // Đã khóa sổ điểm
  lockedAt?: Date;
  lockedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OtherScoreSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const GradeSchema: Schema = new Schema(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      unique: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    midtermScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    otherScores: [OtherScoreSchema],
    finalGrade: {
      type: Number,
      min: 0,
      max: 10,
    },
    letterGrade: {
      type: String,
      enum: ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'],
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

GradeSchema.index({ studentId: 1, classId: 1 }, { unique: true });
GradeSchema.index({ classId: 1 });

export default mongoose.model<IGrade>('Grade', GradeSchema);
