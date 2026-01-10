import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistrationWindow extends Document {
  name: string; // Tên đợt (ĐKHP HK2 2025-2026)
  semesterId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  minCredits: number; // Tín chỉ tối thiểu
  maxCredits: number; // Tín chỉ tối đa
  targetCohorts: string[]; // Khóa áp dụng (['2021', '2022'])
  targetMajors: string[]; // Ngành áp dụng (nếu rỗng = tất cả)
  status: 'draft' | 'open' | 'closed';
  rules: {
    checkPrerequisites: boolean;
    checkScheduleConflict: boolean;
    checkCreditLimit: boolean;
    allowWaitlist: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationWindowSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
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
    minCredits: {
      type: Number,
      required: true,
      min: 0,
    },
    maxCredits: {
      type: Number,
      required: true,
      min: 1,
    },
    targetCohorts: [
      {
        type: String,
      },
    ],
    targetMajors: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'open', 'closed'],
      default: 'draft',
    },
    rules: {
      checkPrerequisites: {
        type: Boolean,
        default: true,
      },
      checkScheduleConflict: {
        type: Boolean,
        default: true,
      },
      checkCreditLimit: {
        type: Boolean,
        default: true,
      },
      allowWaitlist: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

RegistrationWindowSchema.index({ semesterId: 1, status: 1 });

export default mongoose.model<IRegistrationWindow>('RegistrationWindow', RegistrationWindowSchema);
