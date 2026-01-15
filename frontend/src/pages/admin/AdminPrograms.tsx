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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, FilePenLine, Plus, Trash2, Pencil, Unlink } from "lucide-react";
import { Link } from "react-router-dom";
import { adminProgramsAPI, adminCoursesAPI, curriculumAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContentLoader from "@/components/common/ContentLoader";
import { Badge } from "@/components/ui/badge";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    system: "chinh-quy" as "chinh-quy" | "tu-xa",
    cohort: "",
    major: "",
    majorLabel: "",
    version: "1.0",
  });
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isCoursesDialogOpen, setIsCoursesDialogOpen] = useState(false);
  const [isPrerequisitesDialogOpen, setIsPrerequisitesDialogOpen] = useState(false);
  const [isAssignCourseDialogOpen, setIsAssignCourseDialogOpen] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [assignCourseSearch, setAssignCourseSearch] = useState("");
  const [assignSemester, setAssignSemester] = useState<number>(1);
  const [assignCategory, setAssignCategory] = useState<"core" | "required" | "elective">("required");
  const [assignElectiveGroup, setAssignElectiveGroup] = useState<string>("");
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

  // Fetch curriculum mappings for selected program (ProgramCourse)
  const { data: programCourses = [] } = useQuery({
    queryKey: ["admin-program-curriculum", selectedProgram?._id],
    queryFn: () => adminProgramsAPI.getCurriculum(selectedProgram!._id),
    enabled: !!selectedProgram && isCoursesDialogOpen,
  });

  // Fetch prerequisites for selected program
  const { data: prerequisitesData = [] } = useQuery({
    queryKey: ["curriculum-prerequisites", selectedProgram?._id],
    queryFn: () => curriculumAPI.getProgramPrerequisites(selectedProgram!._id),
    enabled: !!selectedProgram && isPrerequisitesDialogOpen,
  });

  const deleteProgramMutation = useMutation({
    mutationFn: (programId: string) => adminProgramsAPI.delete(programId),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "CTĐT đã chuyển sang trạng thái 'Đã xoá'",
      });
      setIsDeleteDialogOpen(false);
      setDeletingProgram(null);
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xoá CTĐT",
        variant: "destructive",
      });
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: ({ programId, data }: { programId: string; data: any }) => adminProgramsAPI.update(programId, data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật CTĐT",
      });
      setIsEditDialogOpen(false);
      setEditingProgram(null);
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật CTĐT",
        variant: "destructive",
      });
    },
  });

  // Fetch unassigned courses (created in "Quản lý học phần")
  const { data: unassignedCourses = [] } = useQuery({
    queryKey: ["admin-courses-unassigned"],
    queryFn: () => adminCoursesAPI.getAll({ unassigned: true }),
    enabled: isAssignCourseDialogOpen,
  });

  // Assign existing course into selected program
  const assignCourseMutation = useMutation({
    mutationFn: async (payloads: any[]) => {
      await Promise.all(payloads.map((payload) => adminProgramsAPI.addToCurriculum(selectedProgram!._id, payload)));
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm học phần vào CTĐT",
      });
      setIsAssignCourseDialogOpen(false);
      setSelectedCourseIds([]);
      setAssignCourseSearch("");
      setAssignSemester(1);
      setAssignCategory("required");
      setAssignElectiveGroup("");
      queryClient.invalidateQueries({ queryKey: ["admin-program-curriculum", selectedProgram?._id] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses-unassigned"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm học phần vào CTĐT",
        variant: "destructive",
      });
    },
  });

  const removeProgramCourseMutation = useMutation({
    mutationFn: (programCourseId: string) => adminProgramsAPI.removeFromCurriculum(selectedProgram!._id, programCourseId),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã gỡ học phần khỏi CTĐT" });
      queryClient.invalidateQueries({ queryKey: ["admin-program-curriculum", selectedProgram?._id] });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi", description: error.message || "Không thể gỡ học phần", variant: "destructive" });
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

  const toggleSelectedCourse = (courseId: string, checked: boolean) => {
    setSelectedCourseIds((prev) => {
      if (checked) return prev.includes(courseId) ? prev : [...prev, courseId];
      return prev.filter((id) => id !== courseId);
    });
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
            <ContentLoader size="card" title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách CTĐT" />
          ) : programs.length === 0 ? (
            <p className="text-muted-foreground">Chưa có CTĐT nào</p>
          ) : (
            programs.map((program: Program) => (
              <div
                key={program._id}
                className={`flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between ${
                  program.isActive ? "" : "opacity-70"
                }`}
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
                  <Badge variant={program.isActive ? "secondary" : "outline"} className="whitespace-nowrap">
                    {program.isActive ? "Đang hoạt động" : "Đã xoá"}
                  </Badge>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Chỉnh sửa CTĐT"
                    aria-label="Chỉnh sửa CTĐT"
                    disabled={!program.isActive}
                    onClick={() => {
                      setEditingProgram(program);
                      setEditFormData({
                        code: program.code,
                        name: program.name,
                        system: program.system,
                        cohort: program.cohort,
                        major: program.major,
                        majorLabel: program.majorLabel,
                        version: program.version || "1.0",
                      });
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    title="Xoá CTĐT"
                    aria-label="Xoá CTĐT"
                    disabled={!program.isActive}
                    onClick={() => {
                      setDeletingProgram(program);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Edit Program Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa CTĐT</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin CTĐT <span className="font-semibold">{editingProgram?.code}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editCode">Mã CTĐT</Label>
              <Input id="editCode" value={editFormData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editName">Tên CTĐT</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Hệ đào tạo</Label>
                <Select
                  value={editFormData.system}
                  onValueChange={(value) => setEditFormData({ ...editFormData, system: value as any })}
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
                <Label htmlFor="editCohort">Khóa</Label>
                <Input
                  id="editCohort"
                  value={editFormData.cohort}
                  onChange={(e) => setEditFormData({ ...editFormData, cohort: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editMajor">Chuyên ngành (code)</Label>
                <Input
                  id="editMajor"
                  value={editFormData.major}
                  onChange={(e) => setEditFormData({ ...editFormData, major: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editMajorLabel">Chuyên ngành (hiển thị)</Label>
                <Input
                  id="editMajorLabel"
                  value={editFormData.majorLabel}
                  onChange={(e) => setEditFormData({ ...editFormData, majorLabel: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editVersion">Version</Label>
              <Input
                id="editVersion"
                value={editFormData.version}
                onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingProgram(null);
              }}
            >
              Huỷ
            </Button>
            <Button
              onClick={() => {
                if (!editingProgram?._id) return;
                updateProgramMutation.mutate({
                  programId: editingProgram._id,
                  data: {
                    name: editFormData.name,
                    system: editFormData.system,
                    cohort: editFormData.cohort,
                    major: editFormData.major,
                    majorLabel: editFormData.majorLabel,
                    version: editFormData.version,
                  },
                });
              }}
              disabled={updateProgramMutation.isPending || !editingProgram?._id}
            >
              {updateProgramMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Program Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá CTĐT?</DialogTitle>
            <DialogDescription>
              Bạn sắp xoá CTĐT <span className="font-semibold">{deletingProgram?.code}</span> –{" "}
              <span className="font-semibold">{deletingProgram?.name}</span>. Thao tác này sẽ ẩn CTĐT (soft delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingProgram(null);
              }}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingProgram?._id && deleteProgramMutation.mutate(deletingProgram._id)}
              disabled={deleteProgramMutation.isPending || !deletingProgram?._id}
            >
              {deleteProgramMutation.isPending ? "Đang xoá..." : "Xoá CTĐT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                onClick={() => setIsAssignCourseDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Thêm học phần đã tạo
              </Button>
            </div>
            {programCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có học phần nào</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 text-left font-medium">Mã</th>
                      <th className="py-2 text-left font-medium">Tên học phần</th>
                      <th className="py-2 text-center font-medium">TC</th>
                      <th className="py-2 text-center font-medium">Loại</th>
                      <th className="py-2 text-center font-medium">HK gợi ý</th>
                      <th className="py-2 text-right font-medium">Gỡ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programCourses.map((pc: any) => {
                      const c = pc.courseId || {};
                      const categoryLabel =
                        pc.category === "core" ? "Chung" : pc.category === "required" ? "Bắt buộc" : "Tự chọn";
                      return (
                        <tr key={pc._id} className="border-b">
                          <td className="py-2 font-medium">{c.code || "N/A"}</td>
                          <td className="py-2">{c.name || "N/A"}</td>
                          <td className="py-2 text-center">{c.credits ?? "—"}</td>
                          <td className="py-2 text-center">{categoryLabel}</td>
                          <td className="py-2 text-center">{pc.recommendedSemester ?? "—"}</td>
                          <td className="py-2 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Gỡ khỏi CTĐT"
                              aria-label="Gỡ khỏi CTĐT"
                              onClick={() => removeProgramCourseMutation.mutate(pc._id)}
                              disabled={removeProgramCourseMutation.isPending}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* Assign Existing Course Dialog */}
      <Dialog
        open={isAssignCourseDialogOpen}
        onOpenChange={(open) => {
          setIsAssignCourseDialogOpen(open);
          if (!open) {
            setSelectedCourseIds([]);
            setAssignCourseSearch("");
            setAssignSemester(1);
            setAssignCategory("required");
            setAssignElectiveGroup("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm học phần đã tạo</DialogTitle>
            <DialogDescription>
              Chọn học phần (đã tạo ở "Quản lý học phần") và gán vào CTĐT: {selectedProgram?.code} - {selectedProgram?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Học phần</Label>
              <Input
                placeholder="Tìm theo mã môn / tên môn"
                value={assignCourseSearch}
                onChange={(e) => setAssignCourseSearch(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Chọn nhiều học phần để thêm một lần. Nếu danh sách trống, hãy tạo học phần ở menu "Quản lý học phần" trước.
              </p>
            </div>

            <div className="rounded-lg border">
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-xs md:text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pl-3 text-left font-medium">Chọn</th>
                      <th className="py-2 text-left font-medium">Mã</th>
                      <th className="py-2 text-left font-medium">Tên</th>
                      <th className="py-2 pr-3 text-left font-medium">TC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(unassignedCourses as any[])
                      .filter((c: any) => {
                        const q = assignCourseSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (c.code || "").toLowerCase().includes(q) ||
                          (c.name || "").toLowerCase().includes(q)
                        );
                      })
                      .map((c: any) => {
                        const checked = selectedCourseIds.includes(c._id);
                        return (
                          <tr key={c._id} className="border-b last:border-b-0">
                            <td className="py-2 pl-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => toggleSelectedCourse(c._id, Boolean(v))}
                                aria-label={`Chọn học phần ${c.code}`}
                              />
                            </td>
                            <td className="py-2">{c.code}</td>
                            <td className="py-2">{c.name}</td>
                            <td className="py-2 pr-3">{c.credits}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignSemester">Học kỳ</Label>
                <Input
                  id="assignSemester"
                  type="number"
                  min="1"
                  max="10"
                  value={assignSemester}
                  onChange={(e) => setAssignSemester(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Loại học phần</Label>
                <Select value={assignCategory} onValueChange={(v) => setAssignCategory(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Chung (mọi ngành)</SelectItem>
                    <SelectItem value="required">Bắt buộc</SelectItem>
                    <SelectItem value="elective">Tự chọn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {assignCategory === "elective" ? (
              <div className="grid gap-2">
                <Label>Nhóm tự chọn (tuỳ chọn)</Label>
                <Input
                  value={assignElectiveGroup}
                  onChange={(e) => setAssignElectiveGroup(e.target.value)}
                  placeholder="VD: Tự chọn ngành / Tự chọn tự do"
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignCourseDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!selectedCourseIds.length || !selectedProgram?._id) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng chọn ít nhất 1 học phần",
                    variant: "destructive",
                  });
                  return;
                }
                const payloads = selectedCourseIds.map((courseId) => ({
                  courseId,
                  category: assignCategory,
                  recommendedSemester: assignSemester,
                  electiveGroup: assignCategory === "elective" ? assignElectiveGroup : "",
                }));
                assignCourseMutation.mutate(payloads);
              }}
              disabled={assignCourseMutation.isPending}
            >
              {assignCourseMutation.isPending ? "Đang thêm..." : "Thêm vào CTĐT"}
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
