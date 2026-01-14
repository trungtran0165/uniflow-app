import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  registrationWindowId?: mongoose.Types.ObjectId; // optional for admin-managed enrollments
  status: 'registered' | 'waitlist' | 'cancelled' | 'dropped';
  waitlistPosition: number; // Vị trí trong waitlist (nếu có)
  enrolledAt: Date;
  cancelledAt?: Date;
  notes: string;
  isForced: boolean; // Đăng ký bắt buộc bởi admin
  forcedBy?: mongoose.Types.ObjectId; // User ID của admin force add
  forcedAt?: Date;
  forceReason?: string; // Lý do force add
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema: Schema = new Schema(
  {
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
    registrationWindowId: {
      type: Schema.Types.ObjectId,
      ref: 'RegistrationWindow',
      required: false,
    },
    status: {
      type: String,
      enum: ['registered', 'waitlist', 'cancelled', 'dropped'],
      default: 'registered',
    },
    waitlistPosition: {
      type: Number,
      default: 0,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    isForced: {
      type: Boolean,
      default: false,
    },
    forcedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    forcedAt: {
      type: Date,
    },
    forceReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

EnrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });
EnrollmentSchema.index({ classId: 1, status: 1 });
EnrollmentSchema.index({ registrationWindowId: 1 });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
