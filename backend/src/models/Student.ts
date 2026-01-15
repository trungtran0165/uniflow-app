import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string; // MSSV
  programId: mongoose.Types.ObjectId; // CTĐT
  cohort: string; // Khóa (2021, 2022, etc.)
  major: string; // Chuyên ngành
  status: 'active' | 'graduated' | 'suspended' | 'dropped';
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    cohort: {
      type: String,
      required: true,
    },
    major: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'graduated', 'suspended', 'dropped'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

StudentSchema.index({ studentId: 1 }, { unique: true });
StudentSchema.index({ programId: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
