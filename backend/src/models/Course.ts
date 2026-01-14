import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  code: string; // Mã học phần (CTDLGT202)
  name: string; // Tên học phần
  credits: number; // Số tín chỉ
  theoryCredits: number; // Số tín chỉ lý thuyết
  practiceCredits: number; // Số tín chỉ thực hành
  description: string;
  programId?: mongoose.Types.ObjectId; // Thuộc CTĐT nào (optional: can be unassigned in course catalog)
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
    theoryCredits: {
      type: Number,
      required: true,
      min: 0,
      default: function (this: any) {
        return this.credits ?? 0;
      },
    },
    practiceCredits: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: false,
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

// Index by code for searching. (Uniqueness is enforced at API level to avoid breaking existing data.)
CourseSchema.index({ code: 1 });
CourseSchema.index({ programId: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
