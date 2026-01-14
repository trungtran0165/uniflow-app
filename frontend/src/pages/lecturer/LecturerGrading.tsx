import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { lecturersAPI, authAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ContentLoader from "@/components/common/ContentLoader";

const LecturerGrading = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId");
  const [lecturerId, setLecturerId] = useState<string | null>(null);

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authAPI.me(),
  });

  useEffect(() => {
    if (userData?.user?.id) {
      setLecturerId(userData.user.id);
    }
  }, [userData]);

  // Fetch students in class
  const { data: studentsData = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["lecturer-class-students", lecturerId, classId],
    queryFn: () => lecturersAPI.getClassStudents(lecturerId!, classId!),
    enabled: !!lecturerId && !!classId,
  });

  // Fetch existing grades
  const { data: gradesData = [] } = useQuery({
    queryKey: ["lecturer-class-grades", lecturerId, classId],
    queryFn: () => lecturersAPI.getClassGrades(lecturerId!, classId!),
    enabled: !!lecturerId && !!classId,
  });

  // Combine students with their grades
  const studentsWithGrades = studentsData.map((student: any) => {
    const grade = gradesData.find((g: any) => 
      g.enrollmentId?.studentId?._id?.toString() === student.student?._id?.toString() ||
      g.enrollmentId?.studentId?._id?.toString() === student.enrollmentId?.toString()
    );
    return {
      _id: student.student?._id || student.enrollmentId,
      studentId: student.student?.studentId || "N/A",
      name: student.student?.userId?.name || student.student?.name || "N/A",
      mid: grade?.midtermScore?.toString() || "",
      final: grade?.finalScore?.toString() || "",
      gradeId: grade?._id,
      enrollmentId: student.enrollmentId,
    };
  });

  const handleDownloadTemplate = async () => {
    if (!classId || !lecturerId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin lớp học",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create Excel-like CSV content
      const csvContent = [
        ["STT", "MSSV", "Họ tên", "Điểm quá trình", "Điểm cuối kỳ", "Điểm tổng kết"],
        ...studentsWithGrades.map((student: any, index: number) => [
          index + 1,
          student.studentId || "",
          student.name || "",
          student.mid || "",
          student.final || "",
          "",
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang-diem-${classId}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Thành công",
        description: "Đã tải template Excel",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải template",
        variant: "destructive",
      });
    }
  };

  return (
    <section aria-labelledby="lecturer-grading-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="lecturer-grading-heading" className="text-xl font-semibold md:text-2xl">
            Nhập điểm lớp CTDLGT202-01
          </h1>
          <p className="text-sm text-muted-foreground">
            Mô phỏng lưới nhập điểm (giống Excel) cho use case "Nhập điểm".
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 text-xs md:text-sm"
          onClick={handleDownloadTemplate}
        >
          <Download className="h-4 w-4" />
          Tải template Excel
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lưới nhập điểm</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full border text-xs md:text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="border px-2 py-1 text-left font-medium">STT</th>
                <th className="border px-2 py-1 text-left font-medium">MSSV</th>
                <th className="border px-2 py-1 text-left font-medium">Họ tên</th>
                <th className="border px-2 py-1 text-center font-medium">Điểm QT (30%)</th>
                <th className="border px-2 py-1 text-center font-medium">Điểm CK (70%)</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingStudents ? (
                <tr>
                  <td colSpan={5} className="border px-2 py-4 text-center text-muted-foreground">
                    <ContentLoader size="card" title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách sinh viên" />
                  </td>
                </tr>
              ) : studentsWithGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border px-2 py-4 text-center text-muted-foreground">
                    Chưa có sinh viên nào trong lớp
                  </td>
                </tr>
              ) : (
                studentsWithGrades.map((row: any, index: number) => (
                  <tr key={row._id || index} className="odd:bg-background even:bg-muted/40">
                    <td className="border px-2 py-1 text-center">{index + 1}</td>
                    <td className="border px-2 py-1 font-medium">{row.studentId}</td>
                    <td className="border px-2 py-1">{row.name}</td>
                    <td className="border px-2 py-1 text-center">
                      <Input defaultValue={row.mid} className="h-8 w-20 text-center text-xs" />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <Input defaultValue={row.final} className="h-8 w-20 text-center text-xs" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
};

export default LecturerGrading;
