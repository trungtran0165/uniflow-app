import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Plus, Upload, Download, Pencil, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContentLoader from "@/components/common/ContentLoader";
import { adminStudentsAPI, adminProgramsAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { exportStudentsToExcel } from "@/lib/excel";

type Program = {
  _id: string;
  code: string;
  name: string;
  cohort: string;
  majorLabel: string;
  system: string;
};

type Student = {
  _id: string;
  studentId: string;
  cohort: string;
  major: string;
  status: string;
  userId?: { name?: string; email?: string };
  programId?: Program;
};

const AdminStudents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({
    studentId: "",
    name: "",
    email: "",
    password: "",
    programId: "",
    cohort: "",
    major: "",
    status: "active",
  });

  const filters = useMemo(() => {
    const f: { programId?: string; keyword?: string } = {};
    if (programFilter !== "all") f.programId = programFilter;
    if (keyword.trim()) f.keyword = keyword.trim();
    return f;
  }, [programFilter, keyword]);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-students", filters],
    queryFn: () => adminStudentsAPI.getAll(filters),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: () => adminProgramsAPI.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => adminStudentsAPI.create(payload),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã tạo sinh viên" });
      setIsEditOpen(false);
      setEditingStudent(null);
      setForm({
        studentId: "",
        name: "",
        email: "",
        password: "",
        programId: "",
        cohort: "",
        major: "",
        status: "active",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể tạo sinh viên", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: any }) =>
      adminStudentsAPI.update(studentId, payload),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật sinh viên" });
      setIsEditOpen(false);
      setEditingStudent(null);
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể cập nhật sinh viên", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => adminStudentsAPI.delete(studentId),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xoá sinh viên" });
      setIsDeleteOpen(false);
      setDeletingStudent(null);
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể xoá sinh viên", variant: "destructive" }),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (students: any[]) => adminStudentsAPI.bulkCreate(students),
    onSuccess: (data: any) => {
      toast({
        title: "Import hoàn tất",
        description: `Thành công ${data?.data?.success || 0}, lỗi ${data?.data?.failed || 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (error: Error) =>
      toast({ title: "Lỗi", description: error.message || "Không thể import sinh viên", variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingStudent(null);
    setForm({
      studentId: "",
      name: "",
      email: "",
      password: "",
      programId: "",
      cohort: "",
      major: "",
      status: "active",
    });
    setIsEditOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setForm({
      studentId: student.studentId || "",
      name: student.userId?.name || "",
      email: student.userId?.email || "",
      password: "",
      programId: student.programId?._id || "",
      cohort: student.cohort || "",
      major: student.major || "",
      status: student.status || "active",
    });
    setIsEditOpen(true);
  };

  const handleProgramChange = (programId: string) => {
    const selected = (programs as Program[]).find((p) => p._id === programId);
    setForm((prev) => ({
      ...prev,
      programId,
      cohort: selected?.cohort || prev.cohort,
      major: selected?.majorLabel || prev.major,
    }));
  };

  const handleSubmit = () => {
    if (!form.studentId || !form.name || !form.email || !form.programId) {
      toast({ title: "Thiếu dữ liệu", description: "Vui lòng nhập MSSV, họ tên, email và CTĐT.", variant: "destructive" });
      return;
    }

    const payload: any = {
      studentId: form.studentId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      programId: form.programId,
      cohort: form.cohort.trim(),
      major: form.major.trim(),
      status: form.status,
    };

    if (form.password.trim()) payload.password = form.password.trim();

    if (editingStudent?._id) {
      updateMutation.mutate({ studentId: editingStudent._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleImportFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

    const programByCode = new Map((programs as Program[]).map((p) => [p.code, p]));

    const payloads = rows.map((row) => {
      const studentId = row.studentId || row.MSSV || row.mssv || "";
      const name = row.name || row.hoten || row["Họ tên"] || "";
      const email = row.email || row.Email || "";
      const programId = row.programId || "";
      const programCode = row.programCode || row["Mã CTĐT"] || "";
      const program = programId
        ? (programs as Program[]).find((p) => p._id === programId)
        : programByCode.get(String(programCode));

      return {
        studentId: String(studentId).trim(),
        name: String(name).trim(),
        email: String(email).trim(),
        programId: program?._id,
        programCode: program ? undefined : programCode,
        cohort: row.cohort || program?.cohort || "",
        major: row.major || program?.majorLabel || "",
        status: row.status || "active",
        password: row.password || "",
      };
    }).filter((row) => row.studentId && row.name && row.email && (row.programId || row.programCode));

    if (payloads.length === 0) {
      toast({ title: "Import thất bại", description: "Không có dòng hợp lệ để import.", variant: "destructive" });
      return;
    }

    bulkImportMutation.mutate(payloads);
  };

  return (
    <section aria-labelledby="admin-students-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-students-heading" className="text-xl font-semibold md:text-2xl">
            Quản lý sinh viên
          </h1>
          <p className="text-sm text-muted-foreground">Danh sách sinh viên toàn hệ thống theo các ngành.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportStudentsToExcel(students as Student[])}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <label className="inline-flex items-center">
            <input
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.currentTarget.value = "";
              }}
            />
            <span className="inline-flex items-center rounded-md border px-3 py-2 text-sm cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </span>
          </label>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm sinh viên
          </Button>
        </div>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">Danh sách sinh viên</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo MSSV / tên / email"
                  className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="h-10 w-[260px] text-sm">
                  <SelectValue placeholder="Lọc theo CTĐT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả CTĐT</SelectItem>
                  {(programs as Program[]).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.code} • {p.cohort} • {p.majorLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          {isLoading ? (
            <ContentLoader size="card" title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách sinh viên" />
          ) : (students as Student[]).length === 0 ? (
            <p className="text-muted-foreground">Chưa có sinh viên nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 text-left font-medium">MSSV</th>
                    <th className="py-2 pr-4 text-left font-medium">Họ tên</th>
                    <th className="py-2 pr-4 text-left font-medium">Email</th>
                    <th className="py-2 pr-4 text-left font-medium">CTĐT</th>
                    <th className="py-2 pr-4 text-left font-medium">Khóa</th>
                    <th className="py-2 pr-4 text-left font-medium">Trạng thái</th>
                    <th className="py-2 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(students as Student[]).map((s) => (
                    <tr key={s._id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 align-top font-semibold">{s.studentId || "N/A"}</td>
                      <td className="py-2 pr-4 align-top">{s.userId?.name || "N/A"}</td>
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{s.userId?.email || ""}</td>
                      <td className="py-2 pr-4 align-top">
                        {s.programId ? (
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {s.programId.code} • {s.programId.majorLabel}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Chưa gán</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{s.cohort || "—"}</td>
                      <td className="py-2 pr-4 align-top">
                        <Badge variant={s.status === "active" ? "secondary" : "outline"}>
                          {s.status === "active"
                            ? "Đang học"
                            : s.status === "graduated"
                              ? "Đã tốt nghiệp"
                              : s.status === "suspended"
                                ? "Tạm dừng"
                                : s.status === "dropped"
                                  ? "Thôi học"
                                  : s.status || "—"}
                        </Badge>
                      </td>
                      <td className="py-2 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openEdit(s)}
                            title="Sửa sinh viên"
                            aria-label="Sửa sinh viên"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingStudent(s);
                              setIsDeleteOpen(true);
                            }}
                            title="Xoá sinh viên"
                            aria-label="Xoá sinh viên"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? `Sửa sinh viên ${editingStudent.studentId}` : "Thêm sinh viên"}</DialogTitle>
            <DialogDescription>Nhập thông tin sinh viên và gán CTĐT.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>MSSV</Label>
              <Input
                value={form.studentId}
                onChange={(e) => setForm((s) => ({ ...s, studentId: e.target.value }))}
                disabled={Boolean(editingStudent)}
              />
            </div>
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder={editingStudent ? "(để trống nếu không đổi)" : "Mặc định 123456 nếu để trống"}
              />
            </div>
            <div className="space-y-2">
              <Label>CTĐT</Label>
              <Select value={form.programId} onValueChange={handleProgramChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn CTĐT" />
                </SelectTrigger>
                <SelectContent>
                  {(programs as Program[]).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.code} • {p.cohort} • {p.majorLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Khóa</Label>
              <Input value={form.cohort} onChange={(e) => setForm((s) => ({ ...s, cohort: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Chuyên ngành</Label>
              <Input value={form.major} onChange={(e) => setForm((s) => ({ ...s, major: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(value) => setForm((s) => ({ ...s, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang học</SelectItem>
                  <SelectItem value="graduated">Đã tốt nghiệp</SelectItem>
                  <SelectItem value="suspended">Tạm dừng</SelectItem>
                  <SelectItem value="dropped">Thôi học</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xoá sinh viên?</DialogTitle>
            <DialogDescription>
              Bạn sắp xoá sinh viên <span className="font-semibold">{deletingStudent?.studentId}</span>. Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingStudent?._id && deleteMutation.mutate(deletingStudent._id)}
              disabled={deleteMutation.isPending || !deletingStudent?._id}
            >
              {deleteMutation.isPending ? "Đang xoá..." : "Xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminStudents;

