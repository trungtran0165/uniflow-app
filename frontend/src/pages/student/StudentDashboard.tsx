import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BookOpenCheck, CalendarDays, ClipboardList, Clock3, Info, Link2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { studentsAPI, authAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import ContentLoader from "@/components/common/ContentLoader";

const StudentDashboard = () => {
  const [studentId, setStudentId] = useState<string | null>(null);

  // Get current user to find studentId
  const { data: userData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authAPI.me(),
  });

  useEffect(() => {
    // Use student.id (Student._id) if available, otherwise fallback to user.id
    if (userData?.student?.id) {
      setStudentId(userData.student.id);
    } else if (userData?.user?.id) {
      // Fallback: use user.id (will be resolved by backend helper function)
      setStudentId(userData.user.id);
    }
  }, [userData]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["student-dashboard", studentId],
    queryFn: () => studentsAPI.getDashboard(studentId!),
    enabled: !!studentId,
  });

  if (isLoading || !studentId) {
    return <ContentLoader title="Đang tải dữ liệu…" subtitle="Đang lấy dashboard sinh viên" />;
  }

  const profile = dashboardData?.profile || {
    name: userData?.user?.name || "Sinh viên",
    code: dashboardData?.studentId || "N/A",
    cohort: dashboardData?.cohort || "N/A",
    major: dashboardData?.major || "N/A",
  };

  const stats = dashboardData?.stats || {
    currentTerm: dashboardData?.currentSemester || "N/A",
    currentCredits: dashboardData?.currentCredits || 0,
    creditsAccumulated: dashboardData?.creditsAccumulated || 0,
    creditsTarget: dashboardData?.creditsTarget || 130,
    gpa: dashboardData?.gpa || 0,
    gpaDelta: dashboardData?.gpaDelta || 0,
    tasks: dashboardData?.tasks?.length || 0,
  };

  const announcements = dashboardData?.announcements || [];
  const scheduleToday = dashboardData?.scheduleToday || [];
  const tasks = dashboardData?.tasks || [];
  const quickLinks = [
    { label: "Đăng ký học phần", to: "/student/registration" },
    { label: "Quản lý đăng ký", to: "/student/registration/manage" },
    { label: "Xem thời khóa biểu", to: "/student/timetable" },
    { label: "Tra cứu bảng điểm", to: "/student/transcript" },
  ];

  return (
    <section aria-labelledby="student-dashboard-heading" className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1
            id="student-dashboard-heading"
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Xin chào, {profile.name} 👋
          </h1>
        </div>

        <div className="glass-panel flex items-center gap-4 rounded-2xl px-4 py-3">
          <div className="hidden rounded-xl bg-primary/10 p-2 text-primary sm:block">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-[120px]">
            <p className="stat-label">Kỳ hiện tại</p>
            <p className="text-sm font-semibold">{stats.currentTerm}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="stat-label">Tín chỉ đã đăng ký</p>
            <p className="stat-value text-xl">{stats.currentCredits}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA tích lũy</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="stat-value">{stats.gpa.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Thay đổi +{stats.gpaDelta.toFixed(2)} so với học kỳ trước.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tín chỉ tích lũy</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
              <p className="stat-value">
                {stats.creditsAccumulated}/{stats.creditsTarget}
              </p>
              <p className="text-xs text-muted-foreground">
                Hoàn thành {Math.round((stats.creditsAccumulated / stats.creditsTarget) * 100)}% CTĐT.
              </p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Việc cần làm hôm nay</CardTitle>
            <Clock3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
              <p className="stat-value">{stats.tasks}</p>
              <p className="text-xs text-muted-foreground">Đừng quên deadline ĐKHP lúc 23:59.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Nhiệm vụ trong tuần</CardTitle>
              <p className="text-xs text-muted-foreground">Bài tập, hạn ĐKHP và nhắc nhở quan trọng.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có nhiệm vụ nào</p>
            ) : (
              tasks.map((task: any) => (
                <div
                  key={task.id || task._id}
                  className="flex items-center justify-between rounded-lg border bg-card/80 px-3 py-2 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{task.title || task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.context || task.description} • Hạn: {task.due || task.deadline}
                    </p>
                  </div>
                  <span className="pill-badge uppercase">
                    {task.type === "registration" && "ĐKHP"}
                    {task.type === "assignment" && "Bài tập"}
                    {task.type === "exam" && "Thi"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Lịch học hôm nay</CardTitle>
              <p className="text-xs text-muted-foreground">
                Tự động đồng bộ từ thời khóa biểu tuần, hiển thị nổi bật buổi học có thay đổi.
              </p>
            </div>
            <Tabs defaultValue="today" className="hidden text-xs sm:block">
              <TabsList className="h-8 bg-muted">
                <TabsTrigger value="today" className="px-2 text-xs">
                  Hôm nay
                </TabsTrigger>
                <TabsTrigger value="week" className="px-2 text-xs" disabled>
                  Cả tuần
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-2">
            {scheduleToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có lịch học hôm nay</p>
            ) : (
              scheduleToday.map((slot: any) => (
                <button
                  type="button"
                  key={slot.id || slot._id}
                  className={`schedule-slot min-h-[72px] w-full ${slot.status === "ongoing" ? "schedule-slot--highlight" : ""}`}
                >
                  <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left">
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          slot.status === "ongoing" ? "text-accent-foreground/90" : "text-muted-foreground"
                        }`}
                      >
                        {slot.time || slot.period}
                      </p>
                      <div className="mt-0.5 flex min-w-0 items-baseline gap-1">
                        <p
                          className={`min-w-0 flex-1 truncate text-sm font-semibold ${
                            slot.status === "ongoing" ? "text-accent-foreground" : "text-foreground"
                          }`}
                        >
                          {slot.course || slot.courseName}
                        </p>
                        <span
                          className={`shrink-0 text-xs font-normal ${
                            slot.status === "ongoing" ? "text-accent-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          ({slot.code || slot.courseCode})
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          slot.status === "ongoing" ? "text-accent-foreground/85" : "text-muted-foreground"
                        }`}
                      >
                        Phòng {slot.room || slot.roomCode}
                      </p>
                    </div>

                    <div className="flex min-w-[96px] items-center justify-end gap-1 text-xs font-medium">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{slot.status === "ongoing" ? "Đang học" : "Sắp diễn ra"}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <div className="min-w-0">
              <CardTitle className="text-base">Thông báo mới</CardTitle>
              <p className="text-xs text-muted-foreground">Tổng hợp từ ĐKHP, lịch học và phòng đào tạo.</p>
            </div>
            <Info className="mt-1 h-4 w-4 shrink-0 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {announcements.length === 0 ? (
              <p className="text-muted-foreground">Không có thông báo mới</p>
            ) : (
              announcements.map((item: any) => (
                <div key={item.id || item._id} className="rounded-lg border bg-card/80 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="uppercase tracking-wide">{item.category || "general"}</span>
                    <span>{item.timestamp || item.createdAt}</span>
                  </div>
                  <p className="mt-1 font-semibold text-foreground">{item.title || item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description || item.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
            <div className="min-w-0">
              <CardTitle className="text-base">Lối tắt quan trọng</CardTitle>
              <p className="text-xs text-muted-foreground">Đi tới các màn hình chính trong portal sinh viên.</p>
            </div>
            <Link2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((link) => (
              <Button
                key={link.to}
                asChild
                variant="outline"
                className="flex h-auto items-center justify-between rounded-xl border-dashed px-4 py-3 text-left"
              >
                <Link to={link.to}>
                  <span className="font-semibold text-foreground">{link.label}</span>
                  <span className="text-xs text-muted-foreground">Nhấp để chuyển</span>
                </Link>
              </Button>
            ))}
            <div className="rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
              <ClipboardList className="mr-2 inline h-3.5 w-3.5" />
              Các lối tắt sẽ được cá nhân hóa dựa trên tiến độ CTĐT ở phiên bản chính thức.
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StudentDashboard;
