import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL || '';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';
const MOODLE_CATEGORY_ID = process.env.MOODLE_CATEGORY_ID || '1';

interface MoodleError {
  error?: string;
  errorcode?: string;
  message?: string;
  exception?: string;
  debuginfo?: string;
}

/**
 * Call Moodle Web Service API
 */
async function callMoodleAPI(functionName: string, params: Record<string, any>) {
  try {
    const response = await axios.post(
      `${MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: MOODLE_TOKEN,
          wsfunction: functionName,
          moodlewsrestformat: 'json',
          ...params,
        },
        timeout: 10000,
      }
    );

    // Check for Moodle errors
    if (response.data?.exception || response.data?.errorcode) {
      const error = response.data as MoodleError;
      throw new Error(
        `Moodle API Error [${error.errorcode}]: ${error.message || error.exception}`
      );
    }

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Moodle API Request Failed:', {
        function: functionName,
        params,
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Moodle API request failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get Moodle user by email
 */
async function getMoodleUserByEmail(email: string) {
  try {
    const users = await callMoodleAPI('core_user_get_users', {
      'criteria[0][key]': 'email',
      'criteria[0][value]': email,
    });

    if (users?.users && users.users.length > 0) {
      return users.users[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting Moodle user:', error);
    return null;
  }
}

/**
 * Create Moodle user
 */
async function createMoodleUser(userData: {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  password: string;
}) {
  try {
    const result = await callMoodleAPI('core_user_create_users', {
      'users[0][username]': userData.username,
      'users[0][email]': userData.email,
      'users[0][firstname]': userData.firstname,
      'users[0][lastname]': userData.lastname,
      'users[0][password]': userData.password,
      'users[0][auth]': 'manual',
    });

    if (result && result[0]) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error('Error creating Moodle user:', error);
    return null;
  }
}

/**
 * Get or create Moodle course by course code
 */
async function getOrCreateMoodleCourse(courseData: {
  code: string;
  name: string;
  credits?: number;
}) {
  try {
    // Search for existing course by shortname (code)
    const courses = await callMoodleAPI('core_course_get_courses_by_field', {
      field: 'shortname',
      value: courseData.code,
    });

    if (courses?.courses && courses.courses.length > 0) {
      return courses.courses[0];
    }

    // Create new course if not found
    const newCourse = await callMoodleAPI('core_course_create_courses', {
      'courses[0][fullname]': courseData.name,
      'courses[0][shortname]': courseData.code,
      'courses[0][categoryid]': MOODLE_CATEGORY_ID,
      'courses[0][summary]': `Course: ${courseData.name} (${courseData.credits || 0} credits)`,
      'courses[0][summaryformat]': 1,
      'courses[0][visible]': 1,  // Visible but requires enrollment to access
    });

    if (newCourse && newCourse[0]) {
      console.log(`✅ Created Moodle course: ${courseData.code}`);
      return newCourse[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting/creating Moodle course:', error);
    return null;
  }
}

/**
 * Enroll user in Moodle course
 */
async function enrollUserInCourse(moodleUserId: number, moodleCourseId: number, roleId: number = 5) {
  try {
    await callMoodleAPI('enrol_manual_enrol_users', {
      'enrolments[0][roleid]': roleId, // 5 = Student role
      'enrolments[0][userid]': moodleUserId,
      'enrolments[0][courseid]': moodleCourseId,
    });

    console.log(`✅ Enrolled user ${moodleUserId} in course ${moodleCourseId}`);
    return true;
  } catch (error) {
    console.error('Error enrolling user in Moodle:', error);
    return false;
  }
}

/**
 * Unenroll user from Moodle course
 */
async function unenrollUserFromCourse(moodleUserId: number, moodleCourseId: number, roleId: number = 5) {
  try {
    await callMoodleAPI('enrol_manual_unenrol_users', {
      'enrolments[0][roleid]': roleId,
      'enrolments[0][userid]': moodleUserId,
      'enrolments[0][courseid]': moodleCourseId,
    });

    console.log(`✅ Unenrolled user ${moodleUserId} from course ${moodleCourseId}`);
    return true;
  } catch (error) {
    console.error('Error unenrolling user from Moodle:', error);
    return false;
  }
}

/**
 * Main function: Sync enrollment to Moodle
 */
export async function syncEnrollmentToMoodle(enrollmentData: {
  studentEmail: string;
  studentName: string;
  studentId: string;
  courseCode: string;
  courseName: string;
  credits?: number;
}) {
  try {
    if (!MOODLE_URL || !MOODLE_TOKEN) {
      console.warn('⚠️ Moodle not configured (missing MOODLE_URL or MOODLE_TOKEN)');
      return { success: false, reason: 'Moodle not configured' };
    }

    // 1. Get or create Moodle user
    let moodleUser = await getMoodleUserByEmail(enrollmentData.studentEmail);
    
    if (!moodleUser) {
      // Create user with default password (student should change it)
      moodleUser = await createMoodleUser({
        username: enrollmentData.studentId,
        email: enrollmentData.studentEmail,
        firstname: enrollmentData.studentName.split(' ')[0] || enrollmentData.studentName,
        lastname: enrollmentData.studentName.split(' ').slice(1).join(' ') || 'Student',
        password: 'TempPassword123!', // Default password
      });

      if (!moodleUser) {
        console.error('❌ Failed to create Moodle user');
        return { success: false, reason: 'Failed to create Moodle user' };
      }
      console.log(`✅ Created Moodle user: ${enrollmentData.studentEmail}`);
    }

    // 2. Get or create Moodle course
    const moodleCourse = await getOrCreateMoodleCourse({
      code: enrollmentData.courseCode,
      name: enrollmentData.courseName,
      credits: enrollmentData.credits,
    });

    if (!moodleCourse) {
      console.error('❌ Failed to get/create Moodle course');
      return { success: false, reason: 'Failed to get/create Moodle course' };
    }

    // 3. Enroll user in course
    const enrolled = await enrollUserInCourse(moodleUser.id, moodleCourse.id);

    if (!enrolled) {
      console.error('❌ Failed to enroll user in Moodle course');
      return { success: false, reason: 'Failed to enroll user' };
    }

    return {
      success: true,
      moodleUserId: moodleUser.id,
      moodleCourseId: moodleCourse.id,
    };
  } catch (error) {
    console.error('❌ Error syncing enrollment to Moodle:', error);
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Main function: Sync unenrollment to Moodle
 */
export async function syncUnenrollmentToMoodle(unenrollmentData: {
  studentEmail: string;
  courseCode: string;
}) {
  try {
    if (!MOODLE_URL || !MOODLE_TOKEN) {
      console.warn('⚠️ Moodle not configured');
      return { success: false, reason: 'Moodle not configured' };
    }

    // 1. Get Moodle user
    const moodleUser = await getMoodleUserByEmail(unenrollmentData.studentEmail);
    if (!moodleUser) {
      console.warn('⚠️ Moodle user not found');
      return { success: false, reason: 'Moodle user not found' };
    }

    // 2. Get Moodle course
    const courses = await callMoodleAPI('core_course_get_courses_by_field', {
      field: 'shortname',
      value: unenrollmentData.courseCode,
    });

    if (!courses?.courses || courses.courses.length === 0) {
      console.warn('⚠️ Moodle course not found');
      return { success: false, reason: 'Moodle course not found' };
    }

    const moodleCourse = courses.courses[0];

    // 3. Unenroll user from course
    const unenrolled = await unenrollUserFromCourse(moodleUser.id, moodleCourse.id);

    if (!unenrolled) {
      console.error('❌ Failed to unenroll user from Moodle');
      return { success: false, reason: 'Failed to unenroll user' };
    }

    return {
      success: true,
      moodleUserId: moodleUser.id,
      moodleCourseId: moodleCourse.id,
    };
  } catch (error) {
    console.error('❌ Error syncing unenrollment to Moodle:', error);
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create Moodle user only (for student registration in SIS)
 */
export async function createMoodleUserOnly(userData: {
  studentId: string;
  email: string;
  name: string;
}) {
  try {
    if (!MOODLE_URL || !MOODLE_TOKEN) {
      console.warn('⚠️ Moodle not configured');
      return { success: false, reason: 'Moodle not configured' };
    }

    // Check if user already exists
    const existingUser = await getMoodleUserByEmail(userData.email);
    if (existingUser) {
      console.log(`ℹ️ Moodle user already exists: ${userData.email}`);
      return { success: true, moodleUserId: existingUser.id, alreadyExists: true };
    }

    // Create new user
    const moodleUser = await createMoodleUser({
      username: userData.studentId,
      email: userData.email,
      firstname: userData.name.split(' ')[0] || userData.name,
      lastname: userData.name.split(' ').slice(1).join(' ') || 'Student',
      password: 'TempPassword123!',
    });

    if (!moodleUser) {
      console.error('❌ Failed to create Moodle user');
      return { success: false, reason: 'Failed to create Moodle user' };
    }

    console.log(`✅ Created Moodle user: ${userData.email}`);
    return { success: true, moodleUserId: moodleUser.id, alreadyExists: false };
  } catch (error) {
    console.error('❌ Error creating Moodle user:', error);
    return { success: false, reason: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default {
  syncEnrollmentToMoodle,
  syncUnenrollmentToMoodle,
  createMoodleUserOnly,
};
