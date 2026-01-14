import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Student schemas
export const studentIdSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
});

// Registration schemas
export const enrollSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
});

export const enrollmentIdSchema = z.object({
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
});

// Admin - Program schemas
export const createProgramSchema = z.object({
  code: z.string().min(1, 'Program code is required'),
  name: z.string().min(1, 'Program name is required'),
  system: z.enum(['chinh-quy', 'tu-xa']),
  cohort: z.string().min(1, 'Cohort is required'),
  major: z.string().min(1, 'Major is required'),
  majorLabel: z.string().min(1, 'Major label is required'),
  html: z.string().optional(),
  version: z.string().optional(),
});

export const updateProgramSchema = createProgramSchema.partial();

// Admin - Course schemas
export const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  credits: z.number().int().min(1, 'Credits must be at least 1'),
  theoryCredits: z.number().int().min(0).optional(),
  practiceCredits: z.number().int().min(0).optional(),
  description: z.string().optional(),
  programId: z.string().min(1, 'Program ID is required'),
  semester: z.number().int().min(1, 'Semester must be at least 1'),
  isRequired: z.boolean().optional(),
  prerequisites: z.array(z.string()).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

// Admin - Class schemas
export const scheduleItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  period: z.string().min(1, 'Period is required'),
  roomId: z.string().min(1, 'Room ID is required'),
});

export const createClassSchema = z.object({
  code: z.string().min(1, 'Class code is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  semesterId: z.string().min(1, 'Semester ID is required'),
  lecturerId: z.string().min(1, 'Lecturer ID is required'),
  schedule: z.array(scheduleItemSchema).default([]), // Allow empty schedule, can be added later
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  notes: z.string().optional(),
});

export const updateClassSchema = createClassSchema.partial().extend({
  status: z.enum(['draft', 'open', 'closed', 'cancelled']).optional(),
});

// Admin - Registration Window schemas
export const createRegistrationWindowSchema = z.object({
  name: z.string().min(1, 'Window name is required'),
  semesterId: z.string().min(1, 'Semester ID is required'),
  startDate: z.union([z.string().datetime(), z.string()]),
  endDate: z.union([z.string().datetime(), z.string()]),
  minCredits: z.number().int().min(0),
  maxCredits: z.number().int().min(1),
  classIds: z.array(z.string()).optional(),
  targetCohorts: z.array(z.string()).optional(),
  targetMajors: z.array(z.string()).optional(),
  rules: z.object({
    checkPrerequisites: z.boolean().optional(),
    checkScheduleConflict: z.boolean().optional(),
    checkCreditLimit: z.boolean().optional(),
    allowWaitlist: z.boolean().optional(),
  }).optional(),
});

export const updateRegistrationWindowSchema = createRegistrationWindowSchema.partial();

// Lecturer - Grade schemas
export const updateGradeSchema = z.object({
  midtermScore: z.number().min(0).max(10).optional(),
  finalScore: z.number().min(0).max(10).optional(),
  otherScores: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(10),
    weight: z.number().min(0).max(100),
  })).optional(),
});

// Common ID schemas
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const courseIdParamSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

export const roomIdParamSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
});

export const programIdSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
});

export const classIdSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
});

export const windowIdSchema = z.object({
  windowId: z.string().min(1, 'Window ID is required'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'closed'], {
    errorMap: () => ({ message: 'Status must be: draft, open, or closed' }),
  }),
});

export const semesterIdSchema = z.object({
  semesterId: z.string().min(1, 'Semester ID is required'),
});
