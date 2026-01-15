import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Users, Plus, Trash2, Download } from "lucide-react";
import { adminClassesAPI, curriculumAPI, adminSemestersAPI, adminRoomsAPI, usersAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContentLoader from "@/components/common/ContentLoader";
import { exportClassStudentsToExcel } from "@/lib/excel";
import { Checkbox } from "@/components/ui/checkbox";

interface Class {
  _id: string;
  code: string;
  courseId: {
    _id: string;
    code: string;
    name: string;
    credits: number;
  };
  semesterId: {
    _id: string;
    name: string;
    code: string;
  };
  lecturerId: {
    _id: string;
    name: string;
    email: string;
  };
  schedule: Array<{
    dayOfWeek: number;
    period: string;
    roomId: {
      _id: string;
      code: string;
      name: string;
    };
  }>;
  capacity: number;
  enrolled: number;
  status: string;
}

const AdminClasses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isEditScheduleDialogOpen, setIsEditScheduleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [studentsClass, setStudentsClass] = useState<Class | null>(null);
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [forceAdd, setForceAdd] = useState(false);
  const [forceReason, setForceReason] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [scheduleFormData, setScheduleFormData] = useState<Array<{ dayOfWeek: number; period: string; roomId: string }>>([]);
  const [formData, setFormData] = useState({
    code: "",
    courseId: "",
    semesterId: "",
    lecturerId: "",
    capacity: 50,
    schedule: [] as Array<{ dayOfWeek: number; period: string; roomId: string }>,
  });

  // Fetch classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: () => adminClassesAPI.getAll(),
  });

  // Fetch programs
  const { data: programs = [] } = useQuery({
    queryKey: ["curriculum-programs"],
    queryFn: () => curriculumAPI.getPrograms(),
  });

  // Fetch courses for selected program
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const { data: courses = [] } = useQuery({
    queryKey: ["admin-program-courses", selectedProgramId],
    queryFn: () => curriculumAPI.getProgramCourses(selectedProgramId),
    enabled: !!selectedProgramId,
  });

  // Fetch semesters
  const { data: semesters = [] } = useQuery({
    queryKey: ["admin-semesters"],
    queryFn: () => adminSemestersAPI.getAll(),
  });

  // Fetch lecturers
  const { data: lecturers = [] } = useQuery({
    queryKey: ["lecturers"],
    queryFn: () => usersAPI.getLecturers(),
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: () => adminRoomsAPI.getAll(),
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: any) => adminClassesAPI.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo lớp học phần mới",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        code: "",
        courseId: "",
        semesterId: "",
        lecturerId: "",
        capacity: 50,
        schedule: [],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo lớp học phần",
        variant: "destructive",
      });
    },
  });

  const handleCreateClass = () => {
    if (!formData.code || !formData.courseId || !formData.semesterId || !formData.lecturerId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    createClassMutation.mutate({
      code: formData.code,
      courseId: formData.courseId,
      semesterId: formData.semesterId,
      lecturerId: formData.lecturerId,
      capacity: formData.capacity,
      schedule: formData.schedule,
      status: "draft",
    });
  };

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: (data: any) => adminClassesAPI.update(editingClass!._id, { schedule: data }),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật lịch học",
      });
      setIsEditScheduleDialogOpen(false);
      setEditingClass(null);
      setScheduleFormData([]);
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật lịch học",
        variant: "destructive",
      });
    },
  });

  const updateClassStatusMutation = useMutation({
    mutationFn: ({ classId, status }: { classId: string; status: string }) => adminClassesAPI.update(classId, { status }),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật trạng thái lớp" });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái lớp",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ classIds, status }: { classIds: string[]; status: string }) => {
      const results = await Promise.allSettled(
        classIds.map((classId) => adminClassesAPI.update(classId, { status }))
      );
      return results;
    },
    onSuccess: (results) => {
      const failed = results.filter((r) => r.status === "rejected").length;
      const success = results.length - failed;
      toast({
        title: "Cập nhật trạng thái",
        description: failed === 0 ? `Đã cập nhật ${success} lớp` : `Đã cập nhật ${success} lớp, lỗi ${failed} lớp`,
        variant: failed === 0 ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      setSelectedClassIds([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái lớp",
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (classId: string) => adminClassesAPI.delete(classId),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xoá lớp học phần",
      });
      setIsDeleteDialogOpen(false);
      setDeletingClass(null);
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xoá lớp học phần",
        variant: "destructive",
      });
    },
  });

  const { data: classStudents = [], isLoading: isLoadingClassStudents } = useQuery({
    queryKey: ["admin-class-students", studentsClass?._id],
    queryFn: () => adminClassesAPI.getStudents(studentsClass!._id),
    enabled: !!studentsClass && isStudentsDialogOpen,
  });

  const addStudentMutation = useMutation({
    mutationFn: (payload: any) => adminClassesAPI.addStudent(studentsClass!._id, payload),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm sinh viên vào lớp" });
      setStudentIdentifier("");
      setForceReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-class-students", studentsClass?._id] });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể thêm sinh viên", variant: "destructive" }),
  });

  const removeStudentMutation = useMutation({
    mutationFn: (enrollmentId: string) => adminClassesAPI.removeStudent(studentsClass!._id, enrollmentId),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xoá sinh viên khỏi lớp" });
      queryClient.invalidateQueries({ queryKey: ["admin-class-students", studentsClass?._id] });
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể xoá sinh viên", variant: "destructive" }),
  });

  const handleEditSchedule = (cls: Class) => {
    setEditingClass(cls);
    setScheduleFormData(cls.schedule?.map((s: any) => ({
      dayOfWeek: s.dayOfWeek,
      period: s.period,
      roomId: s.roomId?._id || s.roomId,
    })) || []);
    setIsEditScheduleDialogOpen(true);
  };

  const handleAddScheduleSlot = () => {
    setScheduleFormData([...scheduleFormData, { dayOfWeek: 1, period: "", roomId: "" }]);
  };

  const handleRemoveScheduleSlot = (index: number) => {
    setScheduleFormData(scheduleFormData.filter((_, i) => i !== index));
  };

  const handleUpdateSchedule = () => {
    if (scheduleFormData.some(s => !s.period || !s.roomId)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin lịch học",
        variant: "destructive",
      });
      return;
    }

    updateScheduleMutation.mutate(scheduleFormData);
  };

  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  const statusLabel = (status: string) => {
    if (status === "open") return "Đang mở";
    if (status === "closed") return "Đã đóng";
    if (status === "cancelled") return "Đã hủy";
    return "Draft";
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClassIds(classes.map((cls: Class) => cls._id));
    } else {
      setSelectedClassIds([]);
    }
  };

  const toggleSelectOne = (classId: string, checked: boolean) => {
    setSelectedClassIds((prev) => {
      if (checked) return prev.includes(classId) ? prev : [...prev, classId];
      return prev.filter((id) => id !== classId);
    });
  };

  const handleExportStudents = () => {
    if (!studentsClass) return;
    try {
      exportClassStudentsToExcel({
        classCode: studentsClass.code,
        courseName: studentsClass.courseId?.name,
        semesterName: studentsClass.semesterId?.name,
        students: classStudents,
      });
      toast({ title: "Thành công", description: "Đã xuất file Excel danh sách sinh viên" });
    } catch (e) {
      toast({
        title: "Lỗi",
        description: e instanceof Error ? e.message : "Không thể xuất file Excel",
        variant: "destructive",
      });
    }
  };

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
        <Button
          size="sm"
          className="flex items-center gap-2 text-xs md:text-sm"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Tạo lớp học phần mới
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Danh sách lớp học phần</CardTitle>
            <p className="text-xs text-muted-foreground">Bộ lọc theo môn, khoa, giảng viên sẽ được bổ sung sau.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedClassIds.length > 0 ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatusMutation.mutate({ classIds: selectedClassIds, status: "open" })}
                  disabled={bulkUpdateStatusMutation.isPending}
                >
                  Mở lớp ({selectedClassIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatusMutation.mutate({ classIds: selectedClassIds, status: "closed" })}
                  disabled={bulkUpdateStatusMutation.isPending}
                >
                  Đóng lớp
                </Button>
              </>
            ) : null}
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs md:text-sm">
          {isLoading ? (
            <ContentLoader size="card" title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách lớp học phần" />
          ) : classes.length === 0 ? (
            <p className="text-muted-foreground">Chưa có lớp học phần nào</p>
          ) : (
            <>
              <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={selectedClassIds.length === classes.length}
                  onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                  aria-label="Chọn tất cả lớp"
                />
                <span>Chọn tất cả</span>
              </div>
              {classes.map((cls: Class) => (
                <div
                  key={cls._id}
                  className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedClassIds.includes(cls._id)}
                      onCheckedChange={(v) => toggleSelectOne(cls._id, Boolean(v))}
                      aria-label={`Chọn lớp ${cls.code}`}
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {cls.code} – {cls.courseId?.name || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        GV: {cls.lecturerId?.name || "N/A"} •{" "}
                        {cls.schedule?.map((s) => `${dayNames[s.dayOfWeek]} (${s.period})`).join(", ") || "Chưa có lịch"}{" "}
                        • Phòng: {cls.schedule?.[0]?.roomId?.code || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="pill-badge">
                      <Users className="mr-1 h-3.5 w-3.5" /> {cls.enrolled} / {cls.capacity}
                    </span>
                    <span className="pill-badge">{statusLabel(cls.status)}</span>
                    {cls.status === "draft" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateClassStatusMutation.isPending || (cls.schedule?.length ?? 0) === 0}
                        title={(cls.schedule?.length ?? 0) === 0 ? "Cần thêm lịch học trước khi mở lớp" : "Mở lớp cho sinh viên đăng ký"}
                        onClick={() => updateClassStatusMutation.mutate({ classId: cls._id, status: "open" })}
                      >
                        Mở lớp
                      </Button>
                    ) : cls.status === "open" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateClassStatusMutation.isPending}
                        onClick={() => updateClassStatusMutation.mutate({ classId: cls._id, status: "closed" })}
                      >
                        Đóng lớp
                      </Button>
                    ) : null}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditSchedule(cls)}
                    >
                      Sửa lịch / phòng
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setStudentsClass(cls);
                        setIsStudentsDialogOpen(true);
                      }}
                    >
                      Sinh viên
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      title="Xoá lớp học phần"
                      aria-label="Xoá lớp học phần"
                      onClick={() => {
                        setDeletingClass(cls);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Students Dialog */}
      <Dialog
        open={isStudentsDialogOpen}
        onOpenChange={(open) => {
          setIsStudentsDialogOpen(open);
          if (!open) {
            setStudentsClass(null);
            setStudentIdentifier("");
            setForceAdd(false);
            setForceReason("");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Danh sách sinh viên đăng ký</DialogTitle>
            <DialogDescription>
              Lớp: <span className="font-semibold">{studentsClass?.code}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <Label>MSSV / Student ObjectId / UserId</Label>
              <Input
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                placeholder="VD: 21520001"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant={forceAdd ? "default" : "outline"}
                type="button"
                onClick={() => setForceAdd((v) => !v)}
              >
                Force
              </Button>
              <Button
                type="button"
                onClick={() =>
                  addStudentMutation.mutate({
                    studentIdentifier: studentIdentifier.trim(),
                    force: forceAdd,
                    forceReason: forceAdd ? forceReason : undefined,
                  })
                }
                disabled={!studentIdentifier.trim() || addStudentMutation.isPending}
              >
                {addStudentMutation.isPending ? "Đang thêm..." : "Thêm"}
              </Button>
            </div>
          </div>
          {forceAdd ? (
            <div className="grid gap-2">
              <Label>Lý do force (tuỳ chọn)</Label>
              <Input value={forceReason} onChange={(e) => setForceReason(e.target.value)} placeholder="VD: Admin add" />
            </div>
          ) : null}

          <Card className="glass-panel interactive-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Sinh viên</CardTitle>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={handleExportStudents}
                disabled={isLoadingClassStudents || classStudents.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto text-sm">
              {isLoadingClassStudents ? (
                <ContentLoader size="card" title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách sinh viên" />
              ) : classStudents.length === 0 ? (
                <p className="text-muted-foreground">Chưa có sinh viên nào</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 text-left font-medium">MSSV</th>
                      <th className="py-2 text-left font-medium">Họ tên</th>
                      <th className="py-2 text-left font-medium">Email</th>
                      <th className="py-2 text-left font-medium">Trạng thái</th>
                      <th className="py-2 text-right font-medium">Xoá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((row: any) => (
                      <tr key={row.enrollmentId} className="border-b last:border-b-0">
                        <td className="py-2 font-medium">{row.student?.studentId || "N/A"}</td>
                        <td className="py-2">{row.student?.userId?.name || "N/A"}</td>
                        <td className="py-2 text-xs text-muted-foreground">{row.student?.userId?.email || ""}</td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {row.status === "registered"
                            ? "Đã đăng ký"
                            : row.status === "waitlist"
                            ? `Waitlist #${row.waitlistPosition || "?"}`
                            : row.status}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeStudentMutation.mutate(row.enrollmentId)}
                            disabled={removeStudentMutation.isPending}
                            title="Xoá sinh viên khỏi lớp"
                            aria-label="Xoá sinh viên khỏi lớp"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Delete Class Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá lớp học phần?</DialogTitle>
            <DialogDescription>
              Bạn sắp xoá lớp <span className="font-semibold">{deletingClass?.code}</span>. Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingClass(null);
              }}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingClass?._id && deleteClassMutation.mutate(deletingClass._id)}
              disabled={deleteClassMutation.isPending || !deletingClass?._id}
            >
              {deleteClassMutation.isPending ? "Đang xoá..." : "Xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo lớp học phần mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để tạo lớp học phần mới. Lưu ý: Bạn cần có học phần, học kỳ, giảng viên và phòng học
              trước.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Mã lớp</Label>
              <Input
                id="code"
                placeholder="VD: CTDLGT202-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="programId">Chương trình đào tạo</Label>
              <Select
                value={selectedProgramId}
                onValueChange={(value) => {
                  setSelectedProgramId(value);
                  setFormData({ ...formData, courseId: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn CTĐT" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program: any) => (
                    <SelectItem key={program._id} value={program._id}>
                      {program.code} – {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courseId">Học phần</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                disabled={!selectedProgramId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedProgramId ? "Chọn học phần" : "Chọn CTĐT trước"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <SelectItem value="no-courses" disabled>
                      Chưa có học phần (cần tạo trước)
                    </SelectItem>
                  ) : (
                    courses.map((course: any) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code} – {course.name} ({course.credits} TC)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {!selectedProgramId
                  ? "Chọn CTĐT trước để xem danh sách học phần"
                  : courses.length === 0
                    ? "Cần tạo học phần trước ở trang 'CTĐT & Học phần'"
                    : ""}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semesterId">Học kỳ</Label>
              <Select
                value={formData.semesterId}
                onValueChange={(value) => setFormData({ ...formData, semesterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.length === 0 ? (
                    <SelectItem value="no-semesters" disabled>
                      Chưa có học kỳ (cần tạo trước)
                    </SelectItem>
                  ) : (
                    semesters.map((semester: any) => (
                      <SelectItem key={semester._id} value={semester._id}>
                        {semester.name} ({semester.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {semesters.length === 0 ? "Cần tạo học kỳ trước (chức năng này sẽ được thêm sau)" : ""}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lecturerId">Giảng viên</Label>
              <Select
                value={formData.lecturerId}
                onValueChange={(value) => setFormData({ ...formData, lecturerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giảng viên" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.length === 0 ? (
                    <SelectItem value="no-lecturers" disabled>
                      Chưa có giảng viên
                    </SelectItem>
                  ) : (
                    lecturers.map((lecturer: any) => (
                      <SelectItem key={lecturer._id} value={lecturer._id}>
                        {lecturer.name} ({lecturer.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Sĩ số tối đa</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Lịch học (tạm thời để trống, sẽ thêm sau)</Label>
              <p className="text-xs text-muted-foreground">
                Lịch học sẽ được thêm sau khi tạo lớp. Bạn có thể chỉnh sửa lịch bằng nút "Sửa lịch / phòng".
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateClass} disabled={createClassMutation.isPending}>
              {createClassMutation.isPending ? "Đang tạo..." : "Tạo lớp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditScheduleDialogOpen} onOpenChange={setIsEditScheduleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa lịch học / phòng</DialogTitle>
            <DialogDescription>
              Cập nhật lịch học và phòng cho lớp {editingClass?.code}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {scheduleFormData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có lịch học. Nhấn "Thêm ca học" để thêm.</p>
            ) : (
              scheduleFormData.map((slot, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 rounded-lg border p-3">
                  <div className="col-span-12 md:col-span-3">
                    <Label>Thứ</Label>
                    <Select
                      value={slot.dayOfWeek.toString()}
                      onValueChange={(value) => {
                        const newSchedule = [...scheduleFormData];
                        newSchedule[index].dayOfWeek = parseInt(value);
                        setScheduleFormData(newSchedule);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayNames.map((day, dayIndex) => (
                          <SelectItem key={dayIndex} value={dayIndex.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Label>Ca học</Label>
                    <Input
                      placeholder="VD: 1-3, 4-6"
                      value={slot.period}
                      onChange={(e) => {
                        const newSchedule = [...scheduleFormData];
                        newSchedule[index].period = e.target.value;
                        setScheduleFormData(newSchedule);
                      }}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Label>Phòng</Label>
                    <Select
                      value={slot.roomId}
                      onValueChange={(value) => {
                        const newSchedule = [...scheduleFormData];
                        newSchedule[index].roomId = value;
                        setScheduleFormData(newSchedule);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room: any) => (
                          <SelectItem key={room._id} value={room._id}>
                            {room.code} - {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveScheduleSlot(index)}
                      className="text-destructive"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" onClick={handleAddScheduleSlot} className="w-full">
              + Thêm ca học
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditScheduleDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateSchedule} disabled={updateScheduleMutation.isPending}>
              {updateScheduleMutation.isPending ? "Đang cập nhật..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminClasses;
