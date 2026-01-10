import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimetableCell from "@/components/student/TimetableCell";
import { useQuery } from "@tanstack/react-query";
import { studentsAPI, authAPI } from "@/lib/api";

const StudentTimetable = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [weekIndex, setWeekIndex] = useState(0);

  // Get current user to find studentId
  const { data: userData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authAPI.me(),
  });

  useEffect(() => {
    // Use student.id (Student._id) if available, otherwise fallback to user.id
    if (userData?.student?.id) {
      setStudentId(userData.student.id);
    } else if (userData?.user?.id) {
      // Fallback: use user.id (will be resolved by backend helper function)
      setStudentId(userData.user.id);
    }
  }, [userData]);

  // Fetch timetable for current week
  const { data: timetableData, isLoading } = useQuery({
    queryKey: ["student-timetable", studentId, weekIndex],
    queryFn: () => studentsAPI.getTimetableByWeek(studentId!, weekIndex + 1),
    enabled: !!studentId,
  });

  // Convert backend data to frontend format
  const activeWeek = useMemo(() => {
    if (!timetableData) {
      return {
        label: `Tuần ${weekIndex + 1}`,
        days: [],
      };
    }

    // Group schedule by day
    const daysMap: Record<number, any[]> = {};
    timetableData.schedule?.forEach((slot: any) => {
      const dayOfWeek = slot.dayOfWeek || 0;
      if (!daysMap[dayOfWeek]) {
        daysMap[dayOfWeek] = [];
      }
      daysMap[dayOfWeek].push({
        id: slot._id || slot.id,
        course: slot.courseName || slot.course?.name,
        period: slot.period || slot.time,
        room: slot.roomCode || slot.room?.code,
        status: slot.status || "normal",
        changeNote: slot.changeNote || slot.note,
      });
    });

    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const days = Object.entries(daysMap).map(([day, slots]) => ({
      day: dayNames[parseInt(day)],
      slots,
    }));

    return {
      label: timetableData.weekLabel || `Tuần ${weekIndex + 1}`,
      days,
    };
  }, [timetableData, weekIndex]);

  const handleWeekChange = (direction: "prev" | "next") => {
    setWeekIndex((current) => {
      if (direction === "prev") {
        return current === 0 ? 0 : current - 1;
      }
      return current + 1;
    });
  };

  if (isLoading || !studentId) {
    return (
      <section className="space-y-6">
        <p className="text-muted-foreground">Đang tải...</p>
      </section>
    );
  }

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
            <Button variant="ghost" size="sm" onClick={() => handleWeekChange("next")}>
              Tuần sau
            </Button>
            <Clock3 className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeWeek.days.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có lịch học trong tuần này</p>
          ) : (
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
          )}

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
