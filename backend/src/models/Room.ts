import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  code: string; // Mã phòng (B1-103)
  name: string; // Tên phòng
  building: string; // Tòa nhà
  capacity: number; // Sức chứa
  roomType: 'lecture' | 'lab' | 'seminar' | 'other';
  facilities: string[]; // Thiết bị (projector, computer, etc.)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema = new Schema(
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
    building: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    roomType: {
      type: String,
      enum: ['lecture', 'lab', 'seminar', 'other'],
      default: 'lecture',
    },
    facilities: [
      {
        type: String,
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

RoomSchema.index({ code: 1 }, { unique: true });

export default mongoose.model<IRoom>('Room', RoomSchema);
