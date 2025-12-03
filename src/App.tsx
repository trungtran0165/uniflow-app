import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentLayout from "./pages/student/StudentLayout";
import LecturerLayout from "./pages/lecturer/LecturerLayout";
import AdminLayout from "./pages/admin/AdminLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentRegistration from "./pages/student/StudentRegistration";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentTranscript from "./pages/student/StudentTranscript";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import LecturerClasses from "./pages/lecturer/LecturerClasses";
import LecturerGrading from "./pages/lecturer/LecturerGrading";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminRegistrationWindows from "./pages/admin/AdminRegistrationWindows";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="registration" element={<StudentRegistration />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="transcript" element={<StudentTranscript />} />
          </Route>

          <Route path="/lecturer" element={<LecturerLayout />}>
            <Route index element={<LecturerDashboard />} />
            <Route path="classes" element={<LecturerClasses />} />
            <Route path="grading" element={<LecturerGrading />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="programs" element={<AdminPrograms />} />
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
