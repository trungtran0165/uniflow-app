import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText, Users } from "lucide-react";

const AdminDashboard = () => {
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
            <p className="stat-value">12</p>
            <p className="text-xs text-muted-foreground">Ngành/khóa đang áp dụng.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lớp học phần trong kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">324</p>
            <p className="text-xs text-muted-foreground">87% số lớp đã đủ sĩ số tối thiểu.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đợt ĐKHP đang mở</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">1</p>
            <p className="text-xs text-muted-foreground">HK2 2025–2026 • Khoa CNTT &amp; Kinh tế.</p>
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
              <span>15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>30–60 SV</span>
              <span>60%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>&gt; 60 SV</span>
              <span>25%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Nhật ký ĐKHP gần đây</CardTitle>
              <p className="text-xs text-muted-foreground">Minh hoạ cho báo cáo từ chối đăng ký &amp; lịch sử hệ thống.</p>
            </div>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>10:25 – 125 yêu cầu đăng ký thành công.</p>
            <p>10:20 – 12 yêu cầu bị từ chối (tiên quyết / trùng lịch / tín chỉ).</p>
            <p>10:10 – 2 lớp đầy sĩ số sau 3 phút mở đăng ký.</p>
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
