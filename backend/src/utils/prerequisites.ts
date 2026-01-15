import mongoose from 'mongoose';
import Course from '../models/Course.js';

/**
 * Recursively check prerequisites with cycle detection
 * Returns: { valid: boolean, missing: Course[], cycle?: ObjectId[] }
 */
export async function checkPrerequisitesRecursive(
  courseId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId,
  completedCourseIds: Set<string>,
  visited: Set<string> = new Set(),
  path: mongoose.Types.ObjectId[] = []
): Promise<{ 
  valid: boolean; 
  missing: any[]; 
  cycle?: mongoose.Types.ObjectId[] 
}> {
  const courseIdStr = courseId.toString();
  
  // Detect circular dependency
  if (visited.has(courseIdStr)) {
    const cycleStart = path.indexOf(courseId);
    return {
      valid: false,
      missing: [],
      cycle: path.slice(cycleStart).concat(courseId),
    };
  }

  visited.add(courseIdStr);
  path.push(courseId);

  const course = await Course.findById(courseId);
  if (!course || !course.prerequisites || course.prerequisites.length === 0) {
    visited.delete(courseIdStr);
    path.pop();
    return { valid: true, missing: [] };
  }

  const missing: any[] = [];

  for (const prereqId of course.prerequisites) {
    const prereqIdStr = prereqId.toString();
    
    if (!completedCourseIds.has(prereqIdStr)) {
      // Check if prerequisite itself has prerequisites (recursive)
      const prereqCheck = await checkPrerequisitesRecursive(
        prereqId,
        studentId,
        completedCourseIds,
        new Set(visited), // Clone visited set
        [...path] // Clone path
      );

      if (!prereqCheck.valid) {
        if (prereqCheck.cycle) {
          visited.delete(courseIdStr);
          path.pop();
          return prereqCheck; // Return cycle immediately
        }
        missing.push(...prereqCheck.missing);
      }

      // Add this prerequisite to missing list
      const prereqCourse = await Course.findById(prereqId).select('code name');
      if (prereqCourse && !missing.find(m => m._id.toString() === prereqIdStr)) {
        missing.push(prereqCourse);
      }
    }
  }

  visited.delete(courseIdStr);
  path.pop();

  return {
    valid: missing.length === 0,
    missing,
  };
}
