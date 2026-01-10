import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, Filter, Info, Search } from "lucide-react";
import SeatIndicator from "@/components/student/SeatIndicator";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationAPI, authAPI } from "@/lib/api";
import { useEffect } from "react";

const StudentRegistration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [faculty, setFaculty] = useState("tat-ca");
  const [blockingClass, setBlockingClass] = useState<any | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

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

  // Fetch open classes
  const { data: openClassesData = [], isLoading } = useQuery({
    queryKey: ["registration-open-classes", keyword, faculty],
    queryFn: () => {
      if (keyword || faculty !== "tat-ca") {
        return registrationAPI.searchOpenClasses(keyword || undefined, faculty !== "tat-ca" ? faculty : undefined);
      }
      return registrationAPI.getOpenClasses();
    },
  });

  // Fetch registration summary
  const { data: summaryData } = useQuery({
    queryKey: ["registration-summary", studentId],
    queryFn: () => registrationAPI.getSummary(studentId!),
    enabled: !!studentId,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: ({ studentId, classId }: { studentId: string; classId: string }) =>
      registrationAPI.enroll(studentId, classId),
    onSuccess: () => {
      toast({
        title: "Đăng ký thành công",
        description: "Lớp đã được thêm vào danh sách của bạn.",
      });
      queryClient.invalidateQueries({ queryKey: ["registration-open-classes"] });
      queryClient.invalidateQueries({ queryKey: ["registration-summary", studentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Đăng ký thất bại",
        description: error.message || "Không thể đăng ký lớp này",
        variant: "destructive",
      });
    },
  });

  const filterOptions = useMemo(
    () => Array.from(new Set(openClassesData.map((row: any) => row.faculty || row.course?.faculty))).filter(Boolean),
    [openClassesData]
  );

  const filtered = openClassesData.filter((row: any) => {
    const courseName = row.courseName || row.course?.name || "";
    const courseCode = row.code || row.courseCode || row.course?.code || "";
    const matchKeyword =
      !keyword ||
      courseCode.toLowerCase().includes(keyword.toLowerCase()) ||
      courseName.toLowerCase().includes(keyword.toLowerCase());
    const rowFaculty = row.faculty || row.course?.faculty || "";
    const matchFaculty = faculty === "tat-ca" || rowFaculty === faculty;
    return matchKeyword && matchFaculty;
  });

  const handleRegister = (row: any) => {
    if (!studentId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập lại",
        variant: "destructive",
      });
      return;
    }

    const status = row.status || (row.enrolled >= row.capacity ? "full" : "available");
    if (status !== "available") {
      setBlockingClass(row);
      return;
    }

    enrollMutation.mutate({
      studentId,
      classId: row._id || row.id,
    });
  };

  const errorMessageMap: Record<string, string> = {
    full: "Lớp đã đủ sĩ số. Chuyển sang danh sách chờ hoặc chọn lớp khác.",
    conflict: "Lịch học trùng với lớp bạn đã đăng ký. Vui lòng chọn lớp khác.",
    prerequisite: "Bạn chưa hoàn thành học phần tiên quyết. Liên hệ cố vấn nếu cần hỗ trợ.",
    "credit-limit": "Đăng ký vượt quá số tín chỉ tối đa trong đợt này.",
  };

  const blockingMessage =
    blockingClass && blockingClass.status !== "available"
      ? errorMessageMap[blockingClass.status] || "Không thể đăng ký lớp này"
      : "";

  const summary = summaryData || {
    minCredits: 14,
    maxCredits: 24,
    currentCredits: 0,
    deadline: "20/12",
  };

  if (isLoading) {
    return (
      <section className="space-y-6">
        <p className="text-muted-foreground">Đang tải...</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="student-registration-heading" className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 id="student-registration-heading" className="text-xl font-semibold md:text-2xl">
            Đăng ký học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm lớp đang mở, kiểm tra ràng buộc và đăng ký vào lớp phù hợp.
          </p>
        </div>
        {summary.deadline && summary.deadline !== 'N/A' ? (
          <div className="pill-badge flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            Đợt ĐKHP đang mở đến 23:59 ngày {summary.deadline}.
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.2fr)]">
        <Card className="glass-panel interactive-card">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Danh sách lớp đang mở</CardTitle>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                <span className="inline-flex items-center gap-1">•</span>
                <span>Trạng thái cập nhật thời gian thực</span>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo mã môn / tên môn"
                  className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>

              <Select value={faculty} onValueChange={setFaculty}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tat-ca">Tất cả khoa</SelectItem>
                  {filterOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center gap-2 text-xs md:text-sm">
                <Filter className="h-4 w-4" />
                Bộ lọc nâng cao
              </Button>
            </div>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có lớp nào</p>
            ) : (
              <table className="min-w-full text-xs md:text-sm">
                <thead className="border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 text-left font-medium">Mã lớp</th>
                    <th className="py-2 pr-4 text-left font-medium">Học phần</th>
                    <th className="py-2 pr-4 text-left font-medium">Khoa</th>
                    <th className="py-2 pr-4 text-left font-medium">TC</th>
                    <th className="py-2 pr-4 text-left font-medium">Sĩ số</th>
                    <th className="py-2 pr-4 text-left font-medium">Thời gian / Phòng</th>
                    <th className="py-2 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row: any) => {
                    const status = row.status || (row.enrolled >= row.capacity ? "full" : "available");
                    const courseName = row.courseName || row.course?.name || "N/A";
                    const courseCode = row.code || row.courseCode || row.course?.code || "N/A";
                    const credits = row.credits || row.course?.credits || 0;
                    const enrolled = row.enrolled || 0;
                    const capacity = row.capacity || 0;
                    const schedule = row.schedule?.[0] || {};
                    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                    const timeStr = schedule.dayOfWeek !== undefined
                      ? `${dayNames[schedule.dayOfWeek]} (${schedule.period}) • ${schedule.roomId?.code || schedule.roomCode || "N/A"}`
                      : "Chưa có lịch";

                    // Get lecturer name safely
                    const lecturerName = 
                      (typeof row.lecturer === 'object' && row.lecturer?.name) ||
                      (typeof row.lecturerId === 'object' && row.lecturerId?.name) ||
                      (typeof row.lecturer === 'string' ? row.lecturer : null) ||
                      (typeof row.lecturerId === 'string' ? row.lecturerId : null) ||
                      "N/A";

                    return (
                      <tr key={row._id || row.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 align-top font-medium text-foreground">{courseCode}</td>
                        <td className="py-2 pr-4 align-top">
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">{courseName}</p>
                            <p className="text-xs text-muted-foreground">Giảng viên: {lecturerName}</p>
                          </div>
                        </td>
                        <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{row.faculty || row.course?.faculty || "N/A"}</td>
                        <td className="py-2 pr-4 align-top text-center">{credits}</td>
                        <td className="py-2 pr-4 align-top">
                          <SeatIndicator enrolled={enrolled} capacity={capacity} status={status} />
                        </td>
                        <td className="py-2 pr-4 align-top text-xs text-muted-foreground">
                          <div className="space-y-1">
                            <p>{timeStr}</p>
                            {row.note ? <p className="text-[11px] text-primary">{row.note}</p> : null}
                          </div>
                        </td>
                        <td className="py-2 align-top text-right">
                          <Button
                            size="sm"
                            variant={status === "available" ? "default" : "outline"}
                            onClick={() => handleRegister(row)}
                            disabled={enrollMutation.isPending}
                          >
                            {status === "available" && "Chọn đăng ký"}
                            {status === "full" && "Đã đầy"}
                            {status === "conflict" && "Trùng lịch"}
                            {status === "prerequisite" && "Thiếu tiên quyết"}
                            {status === "credit-limit" && "Vượt tín chỉ"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Tóm tắt đăng ký hiện tại</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Dữ liệu minh hoạ cho phần "Quản lý ĐKHP cá nhân" &amp; "Tra cứu CTĐT".
                </p>
              </div>
              <BookOpenCheck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary px-3 py-2">
                <p className="stat-label">Tín chỉ trong kỳ</p>
                <p className="stat-value text-xl">{summary.currentCredits || 0}</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-2">
                <p className="stat-label">Tín chỉ còn trống</p>
                <p className="stat-value text-xl">
                  {Math.max(0, (summary.maxCredits || 24) - (summary.currentCredits || 0))}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-medium text-foreground">Tiến độ CTĐT</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Học phần bắt buộc: {summary.requiredCourses || 0}/{summary.totalRequiredCourses || 0} môn</li>
                <li>• Học phần tự chọn: {summary.electiveCredits || 0}/{summary.totalElectiveCredits || 0} tín chỉ</li>
                <li>• Trạng thái: {summary.status || "Đủ điều kiện đăng ký"}</li>
              </ul>
            </div>

            <div className="rounded-xl border border-dashed p-3 text-xs">
              <p className="font-semibold text-foreground">Quy tắc đợt ĐKHP</p>
              <p className="text-muted-foreground">
                Min {summary.minCredits} TC • Max {summary.maxCredits} TC • Deadline {summary.deadline}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(blockingClass)} onOpenChange={(open) => !open && setBlockingClass(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Không thể đăng ký {blockingClass?.code || blockingClass?.courseCode}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">{blockingClass?.courseName || blockingClass?.course?.name}</p>
            <p className="text-muted-foreground">{blockingMessage}</p>
            {blockingClass?.note ? (
              <p className="text-xs text-primary">Chi tiết: {blockingClass.note}</p>
            ) : null}
            <Badge variant="outline" className="w-fit">
              Liên hệ cố vấn học tập nếu cần hỗ trợ override.
            </Badge>
          </div>
          <Button onClick={() => setBlockingClass(null)} className="mt-4 self-end">
            Đã hiểu
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StudentRegistration;
