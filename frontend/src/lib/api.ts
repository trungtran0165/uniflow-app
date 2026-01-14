// API service for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },
  logout: async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('authToken');
  },
  me: () => apiRequest('/auth/me'),
};

// Admin - Classes API
export const adminClassesAPI = {
  getAll: (semesterId?: string) => {
    const params = semesterId ? `?semesterId=${semesterId}` : '';
    return apiRequest(`/admin/classes${params}`);
  },
  getById: (classId: string) => apiRequest(`/admin/classes/${classId}`),
  create: (data: any) =>
    apiRequest('/admin/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (classId: string, data: any) =>
    apiRequest(`/admin/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (classId: string) =>
    apiRequest(`/admin/classes/${classId}`, {
      method: 'DELETE',
    }),
  getStudents: (classId: string) => apiRequest(`/admin/classes/${classId}/students`),
  addStudent: (classId: string, data: any) =>
    apiRequest(`/admin/classes/${classId}/students`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  removeStudent: (classId: string, enrollmentId: string) =>
    apiRequest(`/admin/classes/${classId}/students/${enrollmentId}`, {
      method: "DELETE",
    }),
};

// Admin - Programs API
export const adminProgramsAPI = {
  getAll: () => apiRequest('/admin/programs'),
  getById: (programId: string) => apiRequest(`/admin/programs/${programId}`),
  create: (data: any) =>
    apiRequest('/admin/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (programId: string, data: any) =>
    apiRequest(`/admin/programs/${programId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (programId: string) =>
    apiRequest(`/admin/programs/${programId}`, {
      method: 'DELETE',
    }),
  getCourses: (programId: string) => apiRequest(`/admin/programs/${programId}/courses`),
  createCourse: (programId: string, data: any) =>
    apiRequest(`/admin/programs/${programId}/courses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // ProgramCourse mapping (new curriculum model)
  getCurriculum: (programId: string) => apiRequest(`/admin/programs/${programId}/curriculum`),
  addToCurriculum: (programId: string, data: any) =>
    apiRequest(`/admin/programs/${programId}/curriculum`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProgramCourse: (programId: string, programCourseId: string, data: any) =>
    apiRequest(`/admin/programs/${programId}/curriculum/${programCourseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  removeFromCurriculum: (programId: string, programCourseId: string) =>
    apiRequest(`/admin/programs/${programId}/curriculum/${programCourseId}`, {
      method: 'DELETE',
    }),
};

// Admin - Registration Windows API
export const adminRegistrationWindowsAPI = {
  getAll: () => apiRequest('/admin/registration-windows'),
  getById: (windowId: string) => apiRequest(`/admin/registration-windows/${windowId}`),
  create: (data: any) =>
    apiRequest('/admin/registration-windows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (windowId: string, data: any) =>
    apiRequest(`/admin/registration-windows/${windowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (windowId: string, status: string) =>
    apiRequest(`/admin/registration-windows/${windowId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (windowId: string) =>
    apiRequest(`/admin/registration-windows/${windowId}`, {
      method: 'DELETE',
    }),
};

// Admin - Courses API (global course catalog)
export const adminCoursesAPI = {
  getAll: (filters?: { programId?: string; unassigned?: boolean; keyword?: string }) => {
    const params = new URLSearchParams();
    if (filters?.programId) params.append("programId", filters.programId);
    if (filters?.unassigned) params.append("unassigned", "true");
    if (filters?.keyword) params.append("keyword", filters.keyword);
    const query = params.toString();
    return apiRequest(`/admin/courses${query ? `?${query}` : ""}`);
  },
  create: (data: any) =>
    apiRequest("/admin/courses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (courseId: string, data: any) =>
    apiRequest(`/admin/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (courseId: string) =>
    apiRequest(`/admin/courses/${courseId}`, {
      method: "DELETE",
    }),
};

// Curriculum API
export const curriculumAPI = {
  getPrograms: (filters?: { system?: string; cohort?: string; major?: string }) => {
    const params = new URLSearchParams();
    if (filters?.system) params.append('system', filters.system);
    if (filters?.cohort) params.append('cohort', filters.cohort);
    if (filters?.major) params.append('major', filters.major);
    const query = params.toString();
    return apiRequest(`/curriculum/programs${query ? `?${query}` : ''}`);
  },
  getProgramById: (programId: string) => apiRequest(`/curriculum/programs/${programId}`),
  getProgramCourses: (programId: string) => apiRequest(`/curriculum/programs/${programId}/courses`),
  getProgramPrerequisites: (programId: string) =>
    apiRequest(`/curriculum/programs/${programId}/prerequisites`),
};

// Registration API
export const registrationAPI = {
  getOpenClasses: () => apiRequest('/registration/open-classes'),
  searchOpenClasses: (keyword?: string, faculty?: string) => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (faculty) params.append('faculty', faculty);
    const query = params.toString();
    return apiRequest(`/registration/open-classes/search${query ? `?${query}` : ''}`);
  },
  enroll: (studentId: string, classId: string) =>
    apiRequest('/registration/enroll', {
      method: 'POST',
      body: JSON.stringify({ studentId, classId }),
    }),
  getEnrollments: (studentId: string) => apiRequest(`/registration/enrollments/${studentId}`),
  cancelEnrollment: (enrollmentId: string) =>
    apiRequest(`/registration/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    }),
  getSummary: (studentId: string) => apiRequest(`/registration/summary/${studentId}`),
  getHistory: (studentId: string, filters?: { action?: string; result?: string }) => {
    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.result) params.append('result', filters.result);
    const query = params.toString();
    return apiRequest(`/registration/history/${studentId}${query ? `?${query}` : ''}`);
  },
};

// Students API
export const studentsAPI = {
  getDashboard: (studentId: string) => apiRequest(`/students/${studentId}/dashboard`),
  getTranscript: (studentId: string) => apiRequest(`/students/${studentId}/transcript`),
  getTranscriptSummary: (studentId: string) => apiRequest(`/students/${studentId}/transcript/summary`),
  getTimetable: (studentId: string) => apiRequest(`/students/${studentId}/timetable`),
  getTimetableByWeek: (studentId: string, week: number) =>
    apiRequest(`/students/${studentId}/timetable/${week}`),
  getScheduleChanges: (studentId: string) => apiRequest(`/students/${studentId}/timetable/changes`),
};

// Admin - Semesters API
export const adminSemestersAPI = {
  getAll: () => apiRequest('/admin/semesters'),
  getById: (semesterId: string) => apiRequest(`/admin/semesters/${semesterId}`),
  create: (data: any) =>
    apiRequest('/admin/semesters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (semesterId: string, data: any) =>
    apiRequest(`/admin/semesters/${semesterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (semesterId: string) =>
    apiRequest(`/admin/semesters/${semesterId}`, {
      method: 'DELETE',
    }),
};

// Admin - Rooms API
export const adminRoomsAPI = {
  getAll: () => apiRequest('/admin/rooms'),
  getById: (roomId: string) => apiRequest(`/admin/rooms/${roomId}`),
  create: (data: any) =>
    apiRequest('/admin/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (roomId: string, data: any) =>
    apiRequest(`/admin/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (roomId: string) =>
    apiRequest(`/admin/rooms/${roomId}`, {
      method: 'DELETE',
    }),
  getSchedule: (roomId: string) => apiRequest(`/admin/rooms/${roomId}/schedule`),
};

// Users API
export const usersAPI = {
  getLecturers: () => apiRequest('/users/lecturers'),
};

// Lecturers API
export const lecturersAPI = {
  getClasses: (lecturerId: string) => apiRequest(`/lecturers/${lecturerId}/classes`),
  getClassById: (lecturerId: string, classId: string) => apiRequest(`/lecturers/${lecturerId}/classes/${classId}`),
  getClassStudents: (lecturerId: string, classId: string) => apiRequest(`/lecturers/${lecturerId}/classes/${classId}/students`),
  getClassGrades: (lecturerId: string, classId: string) => apiRequest(`/lecturers/${lecturerId}/classes/${classId}/grades`),
  updateGrade: (lecturerId: string, classId: string, studentId: string, data: any) =>
    apiRequest(`/lecturers/${lecturerId}/classes/${classId}/grades/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  bulkUpdateGrades: (lecturerId: string, classId: string, data: any) =>
    apiRequest(`/lecturers/${lecturerId}/classes/${classId}/grades/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getGradeTemplate: (lecturerId: string, classId: string) =>
    apiRequest(`/lecturers/${lecturerId}/classes/${classId}/grades/template`),
};
