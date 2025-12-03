import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BookOpenCheck, CalendarDays, ClipboardList, Clock3, Info, Link2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMockStudentSummary } from "@/mocks/student";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const { profile, stats, announcements, scheduleToday, tasks, quickLinks } = useMockStudentSummary();

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
          <p className="text-sm text-muted-foreground">
            Theo dõi tiến độ CTĐT, nhắc việc quan trọng và lịch học trong ngày. Dữ liệu hiện tại là mock để minh họa.
          </p>
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
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border bg-card/80 px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.context} • Hạn: {task.due}
                  </p>
                </div>
                <span className="pill-badge uppercase">
                  {task.type === "registration" && "ĐKHP"}
                  {task.type === "assignment" && "Bài tập"}
                  {task.type === "exam" && "Thi"}
                </span>
              </div>
            ))}
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
            {scheduleToday.map((slot) => (
              <button
                type="button"
                key={slot.id}
                className={`schedule-slot ${slot.status === "ongoing" ? "schedule-slot--highlight" : ""}`}
              >
                <div className="text-left">
                  <p className="text-xs font-medium opacity-80">{slot.time}</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {slot.course} <span className="text-xs font-normal text-muted-foreground">({slot.code})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Phòng {slot.room}</p>
                </div>
                <div className="hidden items-center gap-1 text-xs font-medium sm:flex">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{slot.status === "ongoing" ? "Đang học" : "Sắp diễn ra"}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel interactive-card">
          <CardHeader className="flex items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Thông báo mới</CardTitle>
              <p className="text-xs text-muted-foreground">Tổng hợp từ ĐKHP, lịch học và phòng đào tạo.</p>
            </div>
            <Info className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {announcements.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card/80 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-wide">{item.category}</span>
                  <span>{item.timestamp}</span>
                </div>
                <p className="mt-1 font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Lối tắt quan trọng</CardTitle>
              <p className="text-xs text-muted-foreground">Đi tới các màn hình chính trong portal sinh viên.</p>
            </div>
            <Link2 className="h-4 w-4 text-primary" />
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
