import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users } from "lucide-react";

const classes = [
  {
    code: "CTDLGT202-01",
    name: "Cấu trúc dữ liệu & Giải thuật",
    term: "HK2 2025–2026",
    studentCount: 72,
    status: "Đang học",
  },
  {
    code: "CSDL204-02",
    name: "Cơ sở dữ liệu",
    term: "HK2 2025–2026",
    studentCount: 80,
    status: "Chờ nhập điểm",
  },
];

const LecturerClasses = () => {
  return (
    <section aria-labelledby="lecturer-classes-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="lecturer-classes-heading" className="text-xl font-semibold md:text-2xl">
            Danh sách lớp phụ trách
          </h1>
          <p className="text-sm text-muted-foreground">
            Màn hình tương ứng với use case "Danh sách lớp phụ trách" và "Chi tiết lớp &amp; sinh viên".
          </p>
        </div>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Lớp trong kỳ</CardTitle>
            <p className="text-xs text-muted-foreground">Chọn lớp để xem danh sách sinh viên hoặc nhập điểm.</p>
          </div>
          <Users className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {classes.map((cls) => (
            <div
              key={cls.code}
              className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">{cls.code}</p>
                <p className="text-sm">{cls.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> {cls.term} • Sĩ số: {cls.studentCount}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="pill-badge">{cls.status}</span>
                <Button size="sm" variant="outline">
                  Xem chi tiết lớp
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};

export default LecturerClasses;
