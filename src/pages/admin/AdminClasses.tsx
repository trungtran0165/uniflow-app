import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users } from "lucide-react";

const AdminClasses = () => {
  return (
    <section aria-labelledby="admin-classes-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-classes-heading" className="text-xl font-semibold md:text-2xl">
            Kỳ học &amp; lớp học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Màn hình đại diện cho module cấu hình kỳ học, tạo lớp học phần và xếp phòng/ca.
          </p>
        </div>
        <Button size="sm" className="flex items-center gap-2 text-xs md:text-sm">
          Tạo lớp học phần mới
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Danh sách lớp học phần (HK2 2025–2026)</CardTitle>
            <p className="text-xs text-muted-foreground">Bộ lọc theo môn, khoa, giảng viên sẽ được bổ sung sau.</p>
          </div>
          <CalendarDays className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-2 text-xs md:text-sm">
          <div className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">CTDLGT202-01 – Cấu trúc dữ liệu &amp; Giải thuật</p>
              <p className="text-xs text-muted-foreground">
                GV: TS. Nguyễn Văn D • Thứ 2 (1-3) • Phòng B1-103
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="pill-badge">
                <Users className="mr-1 h-3.5 w-3.5" /> 72 / 80
              </span>
              <Button size="sm" variant="outline">
                Sửa lịch / phòng
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">CSDL204-02 – Cơ sở dữ liệu</p>
              <p className="text-xs text-muted-foreground">
                GV: ThS. Trần Thị E • Thứ 3 (4-6) • Phòng B1-203
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="pill-badge">
                <Users className="mr-1 h-3.5 w-3.5" /> 80 / 80
              </span>
              <Button size="sm" variant="outline">
                Sửa lịch / phòng
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminClasses;
