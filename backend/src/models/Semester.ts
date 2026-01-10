import mongoose, { Schema, Document } from 'mongoose';

export interface ISemester extends Document {
  name: string; // HK1 2025-2026
  code: string; // 20251, 20252, etc.
  academicYear: string; // 2025-2026
  type: 'HK1' | 'HK2' | 'HKHe'; // Loại học kỳ
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SemesterSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['HK1', 'HK2', 'HKHe'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

SemesterSchema.index({ code: 1 }, { unique: true });

export default mongoose.model<ISemester>('Semester', SemesterSchema);
