import mongoose, { Schema, Document } from 'mongoose';

export interface IProgram extends Document {
  code: string; // Mã ngành (7480201)
  name: string; // Tên ngành
  system: 'chinh-quy' | 'tu-xa'; // Hệ đào tạo
  cohort: string; // Khóa CTĐT
  major: string; // Chuyên ngành
  majorLabel: string; // Tên hiển thị chuyên ngành
  html: string; // Nội dung CTĐT (HTML)
  version: string; // Version CTĐT
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    system: {
      type: String,
      enum: ['chinh-quy', 'tu-xa'],
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
    majorLabel: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      default: '',
    },
    version: {
      type: String,
      default: '1.0',
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

ProgramSchema.index({ code: 1, system: 1, cohort: 1, major: 1 }, { unique: true });

export default mongoose.model<IProgram>('Program', ProgramSchema);
