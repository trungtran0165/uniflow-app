import mongoose, { Schema, Document } from 'mongoose';

export type ProgramCourseCategory = 'core' | 'required' | 'elective';

export interface IProgramCourse extends Document {
  programId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  category: ProgramCourseCategory;
  recommendedSemester?: number;
  electiveGroup?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramCourseSchema: Schema = new Schema(
  {
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['core', 'required', 'elective'],
      required: true,
    },
    recommendedSemester: {
      type: Number,
      min: 1,
    },
    electiveGroup: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One mapping per (programId, courseId)
ProgramCourseSchema.index({ programId: 1, courseId: 1 }, { unique: true });
ProgramCourseSchema.index({ category: 1 });

export default mongoose.model<IProgramCourse>('ProgramCourse', ProgramCourseSchema);




