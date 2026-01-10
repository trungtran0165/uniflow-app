import { useState } from "react";
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
import { BookOpenCheck, FilePenLine, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { adminProgramsAPI, curriculumAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Program {
  _id: string;
  code: string;
  name: string;
  system: 'chinh-quy' | 'tu-xa';
  cohort: string;
  major: string;
  majorLabel: string;
  version: string;
  isActive: boolean;
}

const AdminPrograms = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false);
  const [isPrerequisitesDialogOpen, setIsPrerequisitesDialogOpen] = useState(false);
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    code: "",
    name: "",
    credits: 3,
    description: "",
    semester: 1,
    isRequired: true,
    prerequisites: [] as string[],
  });
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    system: "chinh-quy" as "chinh-quy" | "tu-xa",
    cohort: "",
    major: "",
    majorLabel: "",
    version: "1.0",
  });

  // Fetch programs
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: () => adminProgramsAPI.getAll(),
  });

  // Fetch courses for selected program
  const { data: programCourses = [] } = useQuery({
    queryKey: ["admin-program-courses", selectedProgram?._id],
    queryFn: () => adminProgramsAPI.getCourses(selectedProgram!._id),
    enabled: !!selectedProgram && isCoursesDialogOpen,
  });

  // Fetch prerequisites for selected program
  const { data: prerequisitesData = [] } = useQuery({
    queryKey: ["curriculum-prerequisites", selectedProgram?._id],
    queryFn: () => curriculumAPI.getProgramPrerequisites(selectedProgram!._id),
    enabled: !!selectedProgram && isPrerequisitesDialogOpen,
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: (data: any) => adminProgramsAPI.createCourse(selectedProgram!._id, data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo học phần mới",
      });
      setIsCreateCourseDialogOpen(false);
      setCourseFormData({
        code: "",
        name: "",
        credits: 3,
        description: "",
        semester: 1,
        isRequired: true,
        prerequisites: [],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-program-courses", selectedProgram?._id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo học phần",
        variant: "destructive",
      });
    },
  });

  const handleViewCourses = (program: Program) => {
    setSelectedProgram(program);
    setIsCoursesDialogOpen(true);
  };

  const handleViewPrerequisites = (program: Program) => {
    setSelectedProgram(program);
    setIsPrerequisitesDialogOpen(true);
  };

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: (data: any) => adminProgramsAPI.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo CTĐT mới",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        code: "",
        name: "",
        system: "chinh-quy",
        cohort: "",
        major: "",
        majorLabel: "",
        version: "1.0",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo CTĐT",
        variant: "destructive",
      });
    },
  });

  const handleCreateProgram = () => {
    if (!formData.code || !formData.name || !formData.cohort || !formData.major || !formData.majorLabel) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    createProgramMutation.mutate({
      code: formData.code,
      name: formData.name,
      system: formData.system,
      cohort: formData.cohort,
      major: formData.major,
      majorLabel: formData.majorLabel,
      version: formData.version,
      isActive: true,
    });
  };

  return (
    <section aria-labelledby="admin-programs-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-programs-heading" className="text-xl font-semibold md:text-2xl">
            CTĐT &amp; danh mục học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Minh hoạ use case quản lý chương trình đào tạo, học phần và điều kiện tiên quyết.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="flex items-center gap-2 text-xs md:text-sm">
            <Link to="/admin/programs/curriculum-editor">
              <FilePenLine className="h-4 w-4" /> Nội dung CTĐT (HTML)
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-2 text-xs md:text-sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Tạo CTĐT mới
          </Button>
        </div>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Chương trình đào tạo</CardTitle>
            <p className="text-xs text-muted-foreground">Danh sách theo ngành/khóa, có version CTĐT.</p>
          </div>
          <BookOpenCheck className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isLoading ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : programs.length === 0 ? (
            <p className="text-muted-foreground">Chưa có CTĐT nào</p>
          ) : (
            programs.map((program: Program) => (
              <div
                key={program._id}
                className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {program.code} – {program.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Version CTĐT: {program.version} • Hệ: {program.system === 'chinh-quy' ? 'Chính quy' : 'Từ xa'} • Khóa: {program.cohort} • Chuyên ngành: {program.majorLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewCourses(program)}
                  >
                    Danh mục học phần
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleViewPrerequisites(program)}
                  >
                    Điều kiện tiên quyết
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Program Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo CTĐT mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để tạo chương trình đào tạo mới. Mã CTĐT phải là duy nhất.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Mã CTĐT</Label>
              <Input
                id="code"
                placeholder="VD: 7480201"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Tên CTĐT</Label>
              <Input
                id="name"
                placeholder="VD: Công nghệ thông tin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="system">Hệ đào tạo</Label>
                <Select
                  value={formData.system}
                  onValueChange={(value: "chinh-quy" | "tu-xa") => setFormData({ ...formData, system: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chinh-quy">Chính quy</SelectItem>
                    <SelectItem value="tu-xa">Từ xa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cohort">Khóa</Label>
                <Input
                  id="cohort"
                  placeholder="VD: 2023"
                  value={formData.cohort}
                  onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="major">Mã chuyên ngành</Label>
                <Input
                  id="major"
                  placeholder="VD: CNTT"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="majorLabel">Tên chuyên ngành</Label>
                <Input
                  id="majorLabel"
                  placeholder="VD: Công nghệ thông tin"
                  value={formData.majorLabel}
                  onChange={(e) => setFormData({ ...formData, majorLabel: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version">Version CTĐT</Label>
              <Input
                id="version"
                placeholder="VD: 1.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateProgram} disabled={createProgramMutation.isPending}>
              {createProgramMutation.isPending ? "Đang tạo..." : "Tạo CTĐT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Courses Dialog */}
      <Dialog open={isCoursesDialogOpen} onOpenChange={setIsCoursesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Danh mục học phần - {selectedProgram?.code}</DialogTitle>
            <DialogDescription>
              {selectedProgram?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {programCourses.length} học phần
              </p>
              <Button
                size="sm"
                onClick={() => setIsCreateCourseDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Tạo học phần mới
              </Button>
            </div>
            {programCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có học phần nào</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 text-left font-medium">Mã HP</th>
                      <th className="py-2 text-left font-medium">Tên học phần</th>
                      <th className="py-2 text-center font-medium">TC</th>
                      <th className="py-2 text-center font-medium">HK</th>
                      <th className="py-2 text-center font-medium">Bắt buộc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programCourses.map((course: any) => (
                      <tr key={course._id} className="border-b">
                        <td className="py-2 font-medium">{course.code}</td>
                        <td className="py-2">{course.name}</td>
                        <td className="py-2 text-center">{course.credits}</td>
                        <td className="py-2 text-center">{course.semester}</td>
                        <td className="py-2 text-center">
                          {course.isRequired ? "✓" : "○"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsCoursesDialogOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={isCreateCourseDialogOpen} onOpenChange={setIsCreateCourseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo học phần mới</DialogTitle>
            <DialogDescription>
              Thêm học phần vào chương trình đào tạo: {selectedProgram?.code} - {selectedProgram?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="courseCode">Mã học phần *</Label>
              <Input
                id="courseCode"
                placeholder="VD: CTDLGT202"
                value={courseFormData.code}
                onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courseName">Tên học phần *</Label>
              <Input
                id="courseName"
                placeholder="VD: Cấu trúc dữ liệu và giải thuật"
                value={courseFormData.name}
                onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="credits">Số tín chỉ *</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  max="10"
                  value={courseFormData.credits}
                  onChange={(e) => setCourseFormData({ ...courseFormData, credits: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semester">Học kỳ *</Label>
                <Input
                  id="semester"
                  type="number"
                  min="1"
                  max="10"
                  value={courseFormData.semester}
                  onChange={(e) => setCourseFormData({ ...courseFormData, semester: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                placeholder="Mô tả ngắn về học phần (tùy chọn)"
                value={courseFormData.description}
                onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="isRequired">Loại học phần</Label>
              <Select
                value={courseFormData.isRequired ? "required" : "optional"}
                onValueChange={(value) => setCourseFormData({ ...courseFormData, isRequired: value === "required" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Bắt buộc</SelectItem>
                  <SelectItem value="optional">Tự chọn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Điều kiện tiên quyết (tùy chọn)</Label>
              <p className="text-xs text-muted-foreground">
                Bạn có thể thêm điều kiện tiên quyết sau khi tạo học phần.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCourseDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!courseFormData.code || !courseFormData.name) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng điền mã và tên học phần",
                    variant: "destructive",
                  });
                  return;
                }
                createCourseMutation.mutate({
                  code: courseFormData.code,
                  name: courseFormData.name,
                  credits: courseFormData.credits,
                  description: courseFormData.description,
                  semester: courseFormData.semester,
                  isRequired: courseFormData.isRequired,
                  prerequisites: courseFormData.prerequisites,
                });
              }}
              disabled={createCourseMutation.isPending}
            >
              {createCourseMutation.isPending ? "Đang tạo..." : "Tạo học phần"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prerequisites Dialog */}
      <Dialog open={isPrerequisitesDialogOpen} onOpenChange={setIsPrerequisitesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Điều kiện tiên quyết - {selectedProgram?.code}</DialogTitle>
            <DialogDescription>
              {selectedProgram?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {prerequisitesData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có thông tin điều kiện tiên quyết</p>
            ) : (
              <div className="space-y-3">
                {prerequisitesData.map((item: any) => (
                  <div key={item.courseId?._id || item._id} className="rounded-lg border p-3">
                    <p className="font-medium text-sm">
                      {item.courseId?.code || item.code} - {item.courseId?.name || item.name}
                    </p>
                    {item.prerequisites && item.prerequisites.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Cần học trước:</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground ml-2">
                          {item.prerequisites.map((prereq: any, idx: number) => (
                            <li key={idx}>
                              {prereq.code || prereq.courseId?.code} - {prereq.name || prereq.courseId?.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Không có điều kiện tiên quyết</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsPrerequisitesDialogOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminPrograms;
