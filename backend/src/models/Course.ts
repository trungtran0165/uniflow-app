import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  code: string; // Mã học phần (CTDLGT202)
  name: string; // Tên học phần
  credits: number; // Số tín chỉ
  description: string;
  programId: mongoose.Types.ObjectId; // Thuộc CTĐT nào
  semester: number; // Học kỳ (1, 2, 3, etc.)
  isRequired: boolean; // Bắt buộc hay tự chọn
  prerequisites: mongoose.Types.ObjectId[]; // Điều kiện tiên quyết (danh sách Course IDs)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: '',
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    prerequisites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CourseSchema.index({ code: 1 });
CourseSchema.index({ programId: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
