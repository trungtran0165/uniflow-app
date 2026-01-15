import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import Course from '../models/Course.js';
import ProgramCourse from '../models/ProgramCourse.js';

/**
 * Migration:
 * - For each Course that has programId (legacy), create ProgramCourse mapping:
 *   category = isRequired ? 'required' : 'elective'
 *   recommendedSemester = course.semester
 * - Keeps Course.programId/isRequired/semester intact (safe), so rollback is easy.
 *
 * Run:
 *   npm run migrate:program-courses
 */
async function main() {
  dotenv.config();
  await connectDB();

  const legacyCourses = await Course.find({
    isActive: true,
    programId: { $exists: true, $ne: null },
  }).select('_id programId isRequired semester');

  let created = 0;
  let skipped = 0;

  for (const c of legacyCourses as any[]) {
    try {
      await ProgramCourse.create({
        programId: c.programId,
        courseId: c._id,
        category: c.isRequired ? 'required' : 'elective',
        recommendedSemester: c.semester,
        electiveGroup: '',
        isActive: true,
      });
      created++;
    } catch (e: any) {
      if (e?.code === 11000) {
        skipped++;
        continue;
      }
      throw e;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[migrateProgramCourses] created=${created} skipped=${skipped} total=${legacyCourses.length}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});




