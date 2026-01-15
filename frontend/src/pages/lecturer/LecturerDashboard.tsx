import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, LayoutDashboard, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { lecturersAPI, authAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import ContentLoader from "@/components/common/ContentLoader";

const LecturerDashboard = () => {
  const [lecturerId, setLecturerId] = useState<string | null>(null);

  // Get current user to find lecturerId
  const { data: userData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authAPI.me(),
  });

  useEffect(() => {
    if (userData?.user?.id) {
      setLecturerId(userData.user.id);
    }
  }, [userData]);

  // Fetch lecturer classes
  const { data: classesData = [], isLoading } = useQuery({
    queryKey: ["lecturer-classes", lecturerId],
    queryFn: () => lecturersAPI.getClasses(lecturerId!),
    enabled: !!lecturerId,
  });

  if (isLoading || !lecturerId) {
    return <ContentLoader title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách lớp giảng viên" />;
  }

  // Calculate stats
  const todayClasses = classesData.filter((cls: any) => {
    // Filter classes that have schedule today
    const today = new Date().getDay();
    return cls.schedule?.some((s: any) => s.dayOfWeek === today);
  });

  const totalClasses = classesData.length;
  const classesNeedingGrades = classesData.filter((cls: any) => {
    // Filter classes that need grade input
    return cls.status === "open" || cls.status === "closed";
  });

  return (
    <section aria-labelledby="lecturer-dashboard-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="lecturer-dashboard-heading" className="text-xl font-semibold md:text-2xl">
            Dashboard giảng viên
          </h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan lịch dạy hôm nay, thông báo từ PĐT và các lớp đang phụ trách.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ca dạy hôm nay</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">{todayClasses.length}</p>
            <p className="text-xs text-muted-foreground">
              {todayClasses.length > 0
                ? todayClasses.map((cls: any) => cls.courseId?.name || cls.courseName).join(", ")
                : "Không có ca dạy"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớp phụ trách trong kỳ</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">{totalClasses}</p>
            <p className="text-xs text-muted-foreground">
              {totalClasses > 0 ? `${totalClasses} lớp đang phụ trách.` : "Chưa có lớp nào"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái nhập điểm</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">{classesNeedingGrades.length} lớp chờ nhập</p>
            <p className="text-xs text-muted-foreground">Hạn khóa sổ: 30/12/2025.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default LecturerDashboard;
