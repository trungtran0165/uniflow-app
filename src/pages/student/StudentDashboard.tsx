import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BookOpenCheck, CalendarDays, Clock3, TrendingUp } from "lucide-react";

const todaySchedule = [
  {
    id: 1,
    time: "07:30 – 09:15",
    course: "Cấu trúc dữ liệu & Giải thuật",
    code: "CTDLGT202",
    room: "B1-103",
    status: "ongoing" as const,
  },
  {
    id: 2,
    time: "09:30 – 11:15",
    course: "Cơ sở dữ liệu",
    code: "CSDL204",
    room: "B1-203",
    status: "upcoming" as const,
  },
  {
    id: 3,
    time: "13:00 – 15:30",
    course: "Hệ điều hành",
    code: "HDH205",
    room: "A2-401",
    status: "upcoming" as const,
  },
];

const taskList = [
  {
    id: 1,
    title: "Hoàn tất ĐKHP đợt 1",
    course: "HK2 2025–2026",
    due: "23:59 hôm nay",
    type: "registration" as const,
  },
  {
    id: 2,
    title: "Nộp bài tập lớn lần 1",
    course: "CTDL & GT",
    due: "Thứ 5, 21/12",
    type: "assignment" as const,
  },
  {
    id: 3,
    title: "Ôn tập giữa kỳ",
    course: "Cơ sở dữ liệu",
    due: "Thứ 7, 23/12",
    type: "exam" as const,
  },
];

const StudentDashboard = () => {
  return (
    <section aria-labelledby="student-dashboard-heading" className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1
            id="student-dashboard-heading"
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Xin chào, Nguyễn Văn A 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Tóm tắt lịch học hôm nay, tiến độ học tập và trạng thái đăng ký học phần.
          </p>
        </div>

        <div className="glass-panel flex items-center gap-4 rounded-2xl px-4 py-3">
          <div className="hidden rounded-xl bg-primary/10 p-2 text-primary sm:block">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-label">Kỳ hiện tại</p>
            <p className="text-sm font-semibold">HK2 2025–2026</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="stat-label">Tín chỉ đã đăng ký</p>
            <p className="stat-value text-xl">18</p>
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
            <p className="stat-value">3.42</p>
            <p className="text-xs text-muted-foreground">Tăng 0.12 so với học kỳ trước.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tín chỉ tích lũy</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="stat-value">96/130</p>
            <p className="text-xs text-muted-foreground">Đã hoàn thành 73% CTĐT.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Việc cần làm hôm nay</CardTitle>
            <Clock3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="stat-value">3</p>
            <p className="text-xs text-muted-foreground">Đừng quên deadline ĐKHP lúc 23:59.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Nhiệm vụ trong tuần</CardTitle>
              <p className="text-xs text-muted-foreground">Bài tập, hạn ĐKHP và nhắc nhở quan trọng.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {taskList.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border bg-card/80 px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.course} • Hạn: {task.due}
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
              <p className="text-xs text-muted-foreground">Tập trung vào các ca học và phòng học trong ngày.</p>
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
            {todaySchedule.map((slot) => (
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
    </section>
  );
};

export default StudentDashboard;
