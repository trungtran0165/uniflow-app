import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Filter } from "lucide-react";

const AdminRegistrationWindows = () => {
  return (
    <section aria-labelledby="admin-registration-windows-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-registration-windows-heading" className="text-xl font-semibold md:text-2xl">
            Đợt đăng ký học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Minh hoạ use case cấu hình đợt ĐKHP, giới hạn tín chỉ và phạm vi đối tượng.
          </p>
        </div>
        <Button size="sm" className="flex items-center gap-2 text-xs md:text-sm">
          Tạo đợt ĐKHP mới
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Đợt hiện tại</CardTitle>
            <p className="text-xs text-muted-foreground">HK2 2025–2026 • Khoa CNTT</p>
          </div>
          <CalendarDays className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-3 text-xs md:text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-secondary px-3 py-2">
              <p className="stat-label">Thời gian</p>
              <p className="font-semibold text-foreground">10/12 – 20/12/2025</p>
            </div>
            <div className="rounded-lg bg-secondary px-3 py-2">
              <p className="stat-label">Giới hạn tín chỉ</p>
              <p className="font-semibold text-foreground">Tối đa 24 TC / SV</p>
            </div>
            <div className="rounded-lg bg-secondary px-3 py-2">
              <p className="stat-label">Đối tượng</p>
              <p className="font-semibold text-foreground">Khoá 2021–2023</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              Quy tắc ràng buộc: kiểm tra tiên quyết, trùng lịch, giới hạn tín chỉ, sĩ số.
            </div>
            <div className="flex items-center gap-2">
              <span className="pill-badge">Ở trạng thái: Đang mở</span>
              <Button size="sm" variant="outline">
                Đóng đợt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminRegistrationWindows;
