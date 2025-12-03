import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimetableCell from "@/components/student/TimetableCell";
import { timetableWeeks } from "@/mocks/student";

const StudentTimetable = () => {
  const [weekIndex, setWeekIndex] = useState(0);
  const activeWeek = useMemo(() => timetableWeeks[weekIndex] ?? timetableWeeks[0], [weekIndex]);

  const handleWeekChange = (direction: "prev" | "next") => {
    setWeekIndex((current) => {
      if (direction === "prev") {
        return current === 0 ? 0 : current - 1;
      }
      return current === timetableWeeks.length - 1 ? current : current + 1;
    });
  };

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
          <CalendarDays className="h-3.5 w-3.5" /> {activeWeek.label}
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleWeekChange("prev")} disabled={weekIndex === 0}>
              Tuần trước
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWeekChange("next")}
              disabled={weekIndex === timetableWeeks.length - 1}
            >
              Tuần sau
            </Button>
            <Clock3 className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {activeWeek.days.map((day) => (
              <div key={day.day} className="space-y-2 rounded-xl bg-secondary/60 p-3">
                <p className="text-sm font-semibold">{day.day}</p>
                <div className="space-y-2 text-xs">
                  {day.slots.map((slot) => (
                    <TimetableCell
                      key={slot.id}
                      course={slot.course}
                      time={slot.period}
                      room={slot.room}
                      status={slot.status ?? "normal"}
                      note={slot.changeNote}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground">
            <Info className="mr-2 inline h-3.5 w-3.5" />
            Các ô màu vàng cho biết buổi học có thay đổi (đổi phòng / học bù), màu đỏ cho biết buổi học bị hủy.
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default StudentTimetable;
