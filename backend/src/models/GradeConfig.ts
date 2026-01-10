import mongoose, { Schema, Document } from 'mongoose';

export interface IGradeComponent {
  name: string;
  weight: number; // Percentage (0-100)
}

export interface IGradeConfig extends Document {
  classId: mongoose.Types.ObjectId;
  components: IGradeComponent[];
  deadline?: Date; // Deadline for grade entry
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GradeComponentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
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

const GradeConfigSchema: Schema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    components: [GradeComponentSchema],
    deadline: {
      type: Date,
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

// Validation: Total weight must equal 100%
GradeConfigSchema.pre('save', function(next) {
  const totalWeight = this.components.reduce((sum: number, comp: any) => sum + comp.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) { // Allow small floating point error
    return next(new Error(`Total weight must equal 100%. Current: ${totalWeight}%`));
  }
  next();
});

GradeConfigSchema.index({ classId: 1 }, { unique: true });

export default mongoose.model<IGradeConfig>('GradeConfig', GradeConfigSchema);
