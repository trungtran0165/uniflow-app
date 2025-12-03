import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock3 } from "lucide-react";

const timetable = [
  {
    day: "Thứ 2",
    slots: [
      { time: "Tiết 1-3", course: "CTDL & GT", room: "B1-103" },
      { time: "Tiết 4-6", course: "Triết học Mác – Lênin", room: "C2-201" },
    ],
  },
  {
    day: "Thứ 3",
    slots: [{ time: "Tiết 4-6", course: "Cơ sở dữ liệu", room: "B1-203" }],
  },
  {
    day: "Thứ 5",
    slots: [{ time: "Tiết 1-3", course: "Hệ điều hành", room: "A2-401" }],
  },
];

const StudentTimetable = () => {
  return (
    <section aria-labelledby="student-timetable-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="student-timetable-heading" className="text-xl font-semibold md:text-2xl">
            Thời khóa biểu tuần
          </h1>
          <p className="text-sm text-muted-foreground">
            Dữ liệu minh hoạ cho màn hình "Thời khóa biểu" trong sitemap.
          </p>
        </div>
        <div className="pill-badge flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" /> HK2 2025–2026 · Tuần 12
        </div>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Lưới lịch tuần</CardTitle>
            <p className="text-xs text-muted-foreground">
              Bố cục dạng lưới (Thứ &amp; Tiết học) giống trong tài liệu yêu cầu.
            </p>
          </div>
          <Clock3 className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            {timetable.map((column) => (
              <div key={column.day} className="space-y-2 rounded-xl bg-secondary/60 p-3">
                <p className="text-sm font-semibold">{column.day}</p>
                <div className="space-y-2 text-xs">
                  {column.slots.map((slot) => (
                    <div key={`${column.day}-${slot.time}`} className="schedule-slot">
                      <div className="text-left">
                        <p className="font-medium">{slot.course}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.time} • Phòng {slot.room}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Lưu ý: Trong bản triển khai thật, lưới thời khóa biểu có thể hiển thị đầy đủ từ Thứ 2–Chủ nhật và Tiết
            1–12 với tooltip chi tiết khi rê chuột vào từng ô.
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default StudentTimetable;
