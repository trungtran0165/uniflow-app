import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, LayoutDashboard, Users } from "lucide-react";

const LecturerDashboard = () => {
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
            <p className="stat-value">2</p>
            <p className="text-xs text-muted-foreground">08:00 – 11:15 (CTDL &amp; GT, CSDL)</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớp phụ trách trong kỳ</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">4</p>
            <p className="text-xs text-muted-foreground">2 lớp lý thuyết, 2 lớp thực hành.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái nhập điểm</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">1 lớp chờ nhập</p>
            <p className="text-xs text-muted-foreground">Hạn khóa sổ: 30/12/2025.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default LecturerDashboard;
