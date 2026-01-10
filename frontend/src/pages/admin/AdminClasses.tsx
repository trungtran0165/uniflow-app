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
import { CalendarDays, Users, Plus, Trash2 } from "lucide-react";
import { adminClassesAPI, curriculumAPI, adminProgramsAPI, adminSemestersAPI, adminRoomsAPI, usersAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    queryFn: () => adminProgramsAPI.getCourses(selectedProgramId),
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
          <CalendarDays className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-2 text-xs md:text-sm">
          {isLoading ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : classes.length === 0 ? (
            <p className="text-muted-foreground">Chưa có lớp học phần nào</p>
          ) : (
            classes.map((cls: Class) => (
              <div
                key={cls._id}
                className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
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
                <div className="flex items-center gap-2 text-xs">
                  <span className="pill-badge">
                    <Users className="mr-1 h-3.5 w-3.5" /> {cls.enrolled} / {cls.capacity}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditSchedule(cls)}
                  >
                    Sửa lịch / phòng
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
