import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import RequireRole from "./components/auth/RequireRole";
import StudentLayout from "./pages/student/StudentLayout";
import LecturerLayout from "./pages/lecturer/LecturerLayout";
import AdminLayout from "./pages/admin/AdminLayout";

const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentRegistration = lazy(() => import("./pages/student/StudentRegistration"));
const StudentCurriculum = lazy(() => import("./pages/student/StudentCurriculum"));
const StudentRegistrationManage = lazy(() => import("./pages/student/StudentRegistrationManage"));
const StudentRegistrationHistory = lazy(() => import("./pages/student/StudentRegistrationHistory"));
const StudentTimetable = lazy(() => import("./pages/student/StudentTimetable"));
const StudentTranscript = lazy(() => import("./pages/student/StudentTranscript"));

const LecturerDashboard = lazy(() => import("./pages/lecturer/LecturerDashboard"));
const LecturerClasses = lazy(() => import("./pages/lecturer/LecturerClasses"));
const LecturerGrading = lazy(() => import("./pages/lecturer/LecturerGrading"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminPrograms = lazy(() => import("./pages/admin/AdminPrograms"));
const AdminClasses = lazy(() => import("./pages/admin/AdminClasses"));
const AdminRegistrationWindows = lazy(() => import("./pages/admin/AdminRegistrationWindows"));
const AdminCurriculumEditor = lazy(() => import("./pages/admin/AdminCurriculumEditor"));
const AdminSemesters = lazy(() => import("./pages/admin/AdminSemesters"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/student"
            element={
              <RequireRole role="student">
                <StudentLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="curriculum" element={<StudentCurriculum />} />
            <Route path="registration/manage" element={<StudentRegistrationManage />} />
            <Route path="registration/history" element={<StudentRegistrationHistory />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="transcript" element={<StudentTranscript />} />
          </Route>
          <Route
            path="/registration"
            element={
              <RequireRole role="student">
                <StudentLayout />
              </RequireRole>
            }
          >
            <Route index element={<StudentRegistration />} />
          </Route>

          <Route
            path="/lecturer"
            element={
              <RequireRole role="lecturer">
                <LecturerLayout />
              </RequireRole>
            }
          >
            <Route index element={<LecturerDashboard />} />
            <Route path="classes" element={<LecturerClasses />} />
            <Route path="grading" element={<LecturerGrading />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="programs" element={<AdminPrograms />} />
            <Route path="programs/curriculum-editor" element={<AdminCurriculumEditor />} />
            <Route path="semesters" element={<AdminSemesters />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="registration-windows" element={<AdminRegistrationWindows />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
