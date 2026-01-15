import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lecturersAPI, authAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ContentLoader from "@/components/common/ContentLoader";

const LecturerGrading = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get("classId");
  const [lecturerId, setLecturerId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classIdFromUrl);
  const [grades, setGrades] = useState<Record<string, { mid: string; final: string }>>({});

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

  // Fetch lecturer's classes
  const { data: classesData = [] } = useQuery({
    queryKey: ["lecturer-classes", lecturerId],
    queryFn: () => lecturersAPI.getClasses(lecturerId!),
    enabled: !!lecturerId,
  });

  // Fetch students in selected class
  const { data: studentsData = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["lecturer-class-students", lecturerId, selectedClassId],
    queryFn: () => lecturersAPI.getClassStudents(lecturerId!, selectedClassId!),
    enabled: !!lecturerId && !!selectedClassId,
  });

  // Fetch existing grades
  const { data: gradesData = [], refetch: refetchGrades } = useQuery({
    queryKey: ["lecturer-class-grades", lecturerId, selectedClassId],
    queryFn: () => lecturersAPI.getClassGrades(lecturerId!, selectedClassId!),
    enabled: !!lecturerId && !!selectedClassId,
  });

  // Get selected class info
  const selectedClass = classesData.find((c: any) => c._id === selectedClassId);

  // Initialize grades state when data loads
  useEffect(() => {
    if (studentsData.length > 0 && gradesData.length >= 0) {
      const initialGrades: Record<string, { mid: string; final: string }> = {};
      studentsData.forEach((student: any) => {
        const grade = gradesData.find((g: any) => 
          g.studentId?.toString() === student.student?._id?.toString()
        );
        const studentId = student.student?._id || student.enrollmentId;
        initialGrades[studentId] = {
          mid: grade?.midtermScore?.toString() || "",
          final: grade?.finalScore?.toString() || "",
        };
      });
      setGrades(initialGrades);
    }
  }, [studentsData, gradesData]);

  // Handle class selection
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSearchParams({ classId });
    setGrades({});
  };

  // Handle grade input change
  const handleGradeChange = (studentId: string, field: 'mid' | 'final', value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  // Save grades mutation
  const saveGradesMutation = useMutation({
    mutationFn: async () => {
      if (!lecturerId || !selectedClassId) throw new Error("Missing required data");

      const gradeUpdates = studentsData.map((student: any) => {
        const studentId = student.student?._id || student.enrollmentId;
        const gradeData = grades[studentId];
        return {
          studentId: student.student?._id,
          midtermScore: gradeData?.mid && gradeData.mid !== "" ? parseFloat(gradeData.mid) : undefined,
          finalScore: gradeData?.final && gradeData.final !== "" ? parseFloat(gradeData.final) : undefined,
        };
      }).filter(g => 
        g.studentId && 
        (g.midtermScore !== undefined || g.finalScore !== undefined) &&
        (!isNaN(g.midtermScore || 0) && !isNaN(g.finalScore || 0))
      );

      return lecturersAPI.bulkUpdateGrades(lecturerId, selectedClassId, { grades: gradeUpdates });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã lưu điểm sinh viên",
      });
      queryClient.invalidateQueries({ queryKey: ["lecturer-class-grades", lecturerId, selectedClassId] });
      refetchGrades();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu điểm",
        variant: "destructive",
      });
    },
  });

  const handleSaveGrades = () => {
    if (!selectedClassId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn lớp",
        variant: "destructive",
      });
      return;
    }
    saveGradesMutation.mutate();
  };

  const handleDownloadTemplate = async () => {
    if (!selectedClassId || !lecturerId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn lớp",
        variant: "destructive",
      });
      return;
    }

    try {
      const csvContent = [
        ["STT", "MSSV", "Họ tên", "Điểm quá trình (30%)", "Điểm cuối kỳ (70%)"],
        ...studentsData.map((student: any, index: number) => {
          const studentId = student.student?._id || student.enrollmentId;
          const gradeData = grades[studentId] || { mid: "", final: "" };
          return [
            index + 1,
            student.studentId || student.student?.studentId || "",
            student.name || student.student?.userId?.name || "",
            gradeData.mid || "",
            gradeData.final || "",
          ];
        }),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang-diem-${selectedClass?.code || selectedClassId}.csv`);
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

  if (!lecturerId) {
    return <ContentLoader title="Đang tải dữ liệu…" subtitle="Đang xác thực người dùng" />;
  }

  return (
    <section aria-labelledby="lecturer-grading-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 id="lecturer-grading-heading" className="text-xl font-semibold md:text-2xl">
            {selectedClass ? `Nhập điểm lớp ${selectedClass.code}` : "Nhập điểm"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedClass 
              ? `${selectedClass.courseId?.name || "N/A"} - ${selectedClass.semesterId?.name || "N/A"}`
              : "Chọn lớp để nhập điểm cho sinh viên"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 text-xs md:text-sm"
            onClick={handleDownloadTemplate}
            disabled={!selectedClassId || studentsData.length === 0}
          >
            <Download className="h-4 w-4" />
            Tải template
          </Button>
          <Button 
            size="sm" 
            className="flex items-center gap-2 text-xs md:text-sm"
            onClick={handleSaveGrades}
            disabled={!selectedClassId || saveGradesMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {saveGradesMutation.isPending ? "Đang lưu..." : "Lưu điểm"}
          </Button>
        </div>
      </div>

      {/* Class Selection */}
      <Card className="glass-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Chọn lớp</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClassId || ""} onValueChange={handleClassChange}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Chọn lớp để nhập điểm..." />
            </SelectTrigger>
            <SelectContent>
              {classesData.length === 0 ? (
                <SelectItem value="none" disabled>
                  Không có lớp nào
                </SelectItem>
              ) : (
                classesData.map((cls: any) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.code} - {cls.courseId?.name || "N/A"} ({cls.enrolled || 0} SV)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grading Grid */}
      {selectedClassId && (
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
                      Đang tải danh sách sinh viên...
                    </td>
                  </tr>
                ) : studentsData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border px-2 py-4 text-center text-muted-foreground">
                      Chưa có sinh viên nào trong lớp
                    </td>
                  </tr>
                ) : (
                  studentsData.map((student: any, index: number) => {
                    const studentId = student.student?._id || student.enrollmentId;
                    const gradeData = grades[studentId] || { mid: "", final: "" };
                    
                    return (
                      <tr key={studentId || index} className="odd:bg-background even:bg-muted/40">
                        <td className="border px-2 py-1 text-center">{index + 1}</td>
                        <td className="border px-2 py-1 font-medium">
                          {student.studentId || student.student?.studentId || "N/A"}
                        </td>
                        <td className="border px-2 py-1">
                          {student.name || student.student?.userId?.name || "N/A"}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <Input 
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={gradeData.mid}
                            onChange={(e) => handleGradeChange(studentId, 'mid', e.target.value)}
                            className="h-8 w-20 text-center text-xs" 
                            placeholder="0-10"
                          />
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <Input 
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={gradeData.final}
                            onChange={(e) => handleGradeChange(studentId, 'final', e.target.value)}
                            className="h-8 w-20 text-center text-xs" 
                            placeholder="0-10"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default LecturerGrading;
