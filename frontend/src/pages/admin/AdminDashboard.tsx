import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminProgramsAPI, adminClassesAPI, adminRegistrationWindowsAPI } from "@/lib/api";
import ContentLoader from "@/components/common/ContentLoader";

const AdminDashboard = () => {
  // Fetch programs count
  const { data: programsData = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: () => adminProgramsAPI.getAll(),
  });

  // Fetch classes count
  const { data: classesData = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: () => adminClassesAPI.getAll(),
  });

  // Fetch registration windows
  const { data: regWindowsData = [], isLoading: isLoadingWindows } = useQuery({
    queryKey: ["admin-registration-windows"],
    queryFn: () => adminRegistrationWindowsAPI.getAll(),
  });

  const openWindows = regWindowsData.filter((w: any) => w.status === 'open');
  const classesWithMinEnrollment = classesData.filter((c: any) => 
    c.enrolled && c.capacity && (c.enrolled / c.capacity) >= 0.3
  );
  const percentageMinEnrollment = classesData.length > 0 
    ? Math.round((classesWithMinEnrollment.length / classesData.length) * 100)
    : 0;

  // Calculate class distribution by enrollment
  const classDistribution = classesData.reduce((acc: any, cls: any) => {
    const enrolled = cls.enrolled || 0;
    if (enrolled < 30) acc.low++;
    else if (enrolled <= 60) acc.mid++;
    else acc.high++;
    return acc;
  }, { low: 0, mid: 0, high: 0 });

  const totalClasses = classesData.length;
  const lowPercent = totalClasses > 0 ? Math.round((classDistribution.low / totalClasses) * 100) : 0;
  const midPercent = totalClasses > 0 ? Math.round((classDistribution.mid / totalClasses) * 100) : 0;
  const highPercent = totalClasses > 0 ? Math.round((classDistribution.high / totalClasses) * 100) : 0;

  const isLoading = isLoadingPrograms || isLoadingClasses || isLoadingWindows;

  if (isLoading) {
    return <ContentLoader title="Đang tải dữ liệu…" subtitle="Đang lấy thống kê hệ thống" />;
  }

  return (
    <section aria-labelledby="admin-dashboard-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-dashboard-heading" className="text-xl font-semibold md:text-2xl">
            Dashboard PĐT / Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan CTĐT, tình trạng mở lớp và thống kê đợt ĐKHP theo sitemap dự án.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel interactive-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chương trình đào tạo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">{programsData.length}</p>
            <p className="text-xs text-muted-foreground">
              {programsData.length > 0 ? "Ngành/khóa đang áp dụng." : "Chưa có CTĐT nào."}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lớp học phần trong kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">{classesData.length}</p>
            <p className="text-xs text-muted-foreground">
              {percentageMinEnrollment}% số lớp đã đủ sĩ số tối thiểu.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đợt ĐKHP đang mở</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">{openWindows.length}</p>
            <p className="text-xs text-muted-foreground">
              {openWindows.length > 0 
                ? `${openWindows[0]?.name || "N/A"}`
                : "Chưa có đợt nào đang mở."
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Theo dõi sĩ số / độ đầy lớp</CardTitle>
              <p className="text-xs text-muted-foreground">Minh hoạ cho module Báo cáo sĩ số.</p>
            </div>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Lớp &lt; 30 SV</span>
              <span>{lowPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>30–60 SV</span>
              <span>{midPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>&gt; 60 SV</span>
              <span>{highPercent}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Thông tin hệ thống</CardTitle>
              <p className="text-xs text-muted-foreground">Trạng thái hoạt động của hệ thống.</p>
            </div>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>✅ Hệ thống hoạt động bình thường</p>
            <p>📊 Tổng số lớp: {classesData.length}</p>
            <p>📋 Đợt đăng ký đang mở: {openWindows.length}</p>
            <p>🎓 Chương trình đào tạo: {programsData.length}</p>
          </CardContent>
        </Card>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" /> Các báo cáo chi tiết (CSV/PDF) sẽ được triển khai ở giai đoạn tiếp theo.
      </p>
    </section>
  );
};

export default AdminDashboard;
