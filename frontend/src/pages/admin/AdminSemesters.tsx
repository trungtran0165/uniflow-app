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
import { CalendarDays, Plus, Trash2, Pencil } from "lucide-react";
import { adminSemestersAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContentLoader from "@/components/common/ContentLoader";
import { Badge } from "@/components/ui/badge";

interface Semester {
  _id: string;
  name: string;
  code: string;
  academicYear: string;
  type: "HK1" | "HK2" | "HKHe";
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const AdminSemesters = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    academicYear: "",
    type: "HK1" as "HK1" | "HK2" | "HKHe",
    startDate: "",
    endDate: "",
    isActive: false,
  });

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["admin-semesters"],
    queryFn: () => adminSemestersAPI.getAll(),
  });

  const createSemesterMutation = useMutation({
    mutationFn: (data: any) => adminSemestersAPI.create(data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã tạo học kỳ mới" });
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-semesters"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể tạo học kỳ", variant: "destructive" }),
  });

  const updateSemesterMutation = useMutation({
    mutationFn: ({ semesterId, data }: { semesterId: string; data: any }) => adminSemestersAPI.update(semesterId, data),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật học kỳ" });
      setIsEditDialogOpen(false);
      setEditingSemester(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-semesters"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể cập nhật học kỳ", variant: "destructive" }),
  });

  const deleteSemesterMutation = useMutation({
    mutationFn: (semesterId: string) => adminSemestersAPI.delete(semesterId),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xoá học kỳ" });
      setIsDeleteDialogOpen(false);
      setDeletingSemester(null);
      queryClient.invalidateQueries({ queryKey: ["admin-semesters"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể xoá học kỳ", variant: "destructive" }),
  });

  const setActiveMutation = useMutation({
    mutationFn: (semesterId: string) => adminSemestersAPI.update(semesterId, { isActive: true }),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã đặt học kỳ hiện tại" });
      queryClient.invalidateQueries({ queryKey: ["admin-semesters"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể cập nhật học kỳ hiện tại", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      academicYear: "",
      type: "HK1",
      startDate: "",
      endDate: "",
      isActive: false,
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.code || !formData.academicYear || !formData.startDate || !formData.endDate) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    createSemesterMutation.mutate(formData);
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      code: semester.code,
      academicYear: semester.academicYear,
      type: semester.type,
      startDate: new Date(semester.startDate).toISOString().split("T")[0],
      endDate: new Date(semester.endDate).toISOString().split("T")[0],
      isActive: Boolean(semester.isActive),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingSemester) return;
    updateSemesterMutation.mutate({
      semesterId: editingSemester._id,
      data: formData,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <section aria-labelledby="admin-semesters-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-semesters-heading" className="text-xl font-semibold md:text-2xl">
            Quản lý học kỳ
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo học kỳ mới, chỉnh sửa thông tin và chọn học kỳ hiện tại.
          </p>
        </div>
        <Button size="sm" className="flex items-center gap-2 text-xs md:text-sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo học kỳ mới
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Danh sách học kỳ</CardTitle>
            <p className="text-xs text-muted-foreground">Chọn một học kỳ làm hiện tại (isActive).</p>
          </div>
          <CalendarDays className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-2 text-xs md:text-sm">
          {isLoading ? (
            <ContentLoader size="card" title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách học kỳ" />
          ) : (semesters as Semester[]).length === 0 ? (
            <p className="text-muted-foreground">Chưa có học kỳ nào</p>
          ) : (
            (semesters as Semester[]).map((semester) => (
              <div
                key={semester._id}
                className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {semester.name} ({semester.code})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {semester.academicYear} • {semester.type} • {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={semester.isActive ? "secondary" : "outline"}>
                    {semester.isActive ? "Hiện tại" : "Không hoạt động"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={semester.isActive || setActiveMutation.isPending}
                    onClick={() => setActiveMutation.mutate(semester._id)}
                  >
                    Đặt hiện tại
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(semester)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Sửa
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    title="Xoá học kỳ"
                    aria-label="Xoá học kỳ"
                    onClick={() => {
                      setDeletingSemester(semester);
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo học kỳ mới</DialogTitle>
            <DialogDescription>Điền thông tin để tạo học kỳ mới.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên học kỳ</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Mã học kỳ</Label>
              <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="academicYear">Năm học</Label>
              <Input
                id="academicYear"
                placeholder="VD: 2025-2026"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Loại học kỳ</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Semester["type"] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HK1">HK1</SelectItem>
                  <SelectItem value="HK2">HK2</SelectItem>
                  <SelectItem value="HKHe">Hè</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Đặt làm học kỳ hiện tại
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleCreate} disabled={createSemesterMutation.isPending}>
              {createSemesterMutation.isPending ? "Đang tạo..." : "Tạo học kỳ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa học kỳ</DialogTitle>
            <DialogDescription>Cập nhật thông tin học kỳ.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Tên học kỳ</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Mã học kỳ</Label>
              <Input id="edit-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-academicYear">Năm học</Label>
              <Input
                id="edit-academicYear"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Loại học kỳ</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Semester["type"] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HK1">HK1</SelectItem>
                  <SelectItem value="HK2">HK2</SelectItem>
                  <SelectItem value="HKHe">Hè</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Ngày bắt đầu</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">Ngày kết thúc</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Đặt làm học kỳ hiện tại
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleUpdate} disabled={updateSemesterMutation.isPending}>
              {updateSemesterMutation.isPending ? "Đang cập nhật..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá học kỳ?</DialogTitle>
            <DialogDescription>
              Bạn sắp xoá học kỳ <span className="font-semibold">{deletingSemester?.name}</span>. Thao tác này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingSemester?._id && deleteSemesterMutation.mutate(deletingSemester._id)}
              disabled={deleteSemesterMutation.isPending || !deletingSemester?._id}
            >
              {deleteSemesterMutation.isPending ? "Đang xoá..." : "Xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminSemesters;


