import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { lecturersAPI, authAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ContentLoader from "@/components/common/ContentLoader";

const LecturerClasses = () => {
  const navigate = useNavigate();
  const [lecturerId, setLecturerId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Get current user to find lecturerId
  const { data: userData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authAPI.me(),
  });

  useEffect(() => {
    if (userData?.user?.id) {
      setLecturerId(userData.user.id);
    }
  }, [userData]);

  // Fetch lecturer classes
  const { data: classesData = [], isLoading } = useQuery({
    queryKey: ["lecturer-classes", lecturerId],
    queryFn: () => lecturersAPI.getClasses(lecturerId!),
    enabled: !!lecturerId,
  });

  // Fetch class students when viewing details
  const { data: classStudents = [] } = useQuery({
    queryKey: ["lecturer-class-students", lecturerId, selectedClass?._id],
    queryFn: () => lecturersAPI.getClassStudents(lecturerId!, selectedClass!._id),
    enabled: !!lecturerId && !!selectedClass && isDetailDialogOpen,
  });

  const handleViewClassDetails = (cls: any) => {
    setSelectedClass(cls);
    setIsDetailDialogOpen(true);
  };

  const handleGoToGrading = (classId: string) => {
    navigate(`/lecturer/grading?classId=${classId}`);
  };

  if (isLoading || !lecturerId) {
    return <ContentLoader title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách lớp phụ trách" />;
  }

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
          {classesData.length === 0 ? (
            <p className="text-muted-foreground">Chưa có lớp nào</p>
          ) : (
            classesData.map((cls: any, index: number) => {
              const semesterName = cls.semesterId?.name || cls.semester || "N/A";
              const courseName = cls.courseId?.name || cls.courseName || "N/A";
              const enrolled = cls.enrolled || 0;
              const capacity = cls.capacity || 0;
              const status = cls.status === "closed" ? "Chờ nhập điểm" : cls.status === "open" ? "Đang học" : "Draft";

              return (
                <div
                  key={cls._id || cls.id || `class-${index}`}
                  className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{cls.code || "N/A"}</p>
                    <p className="text-sm">{courseName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> {semesterName} • Sĩ số: {enrolled}/{capacity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="pill-badge">{status}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewClassDetails(cls)}
                    >
                      Xem chi tiết lớp
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Class Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết lớp {selectedClass?.code}</DialogTitle>
            <DialogDescription>
              {selectedClass?.courseId?.name || selectedClass?.courseName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Học kỳ</p>
                <p className="text-sm">{selectedClass?.semesterId?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sĩ số</p>
                <p className="text-sm">{selectedClass?.enrolled || 0} / {selectedClass?.capacity || 0}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Danh sách sinh viên</p>
              {classStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có sinh viên nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2 text-left font-medium">STT</th>
                        <th className="py-2 text-left font-medium">MSSV</th>
                        <th className="py-2 text-left font-medium">Họ tên</th>
                        <th className="py-2 text-left font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student: any, index: number) => (
                        <tr key={student._id || student.id} className="border-b">
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2 font-medium">{student.studentId || student.student?.studentId || "N/A"}</td>
                          <td className="py-2">{student.name || student.student?.name || "N/A"}</td>
                          <td className="py-2">
                            <span className="pill-badge">
                              {student.status === "registered" ? "Đã đăng ký" : student.status || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  handleGoToGrading(selectedClass?._id);
                }}
              >
                Nhập điểm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default LecturerClasses;
