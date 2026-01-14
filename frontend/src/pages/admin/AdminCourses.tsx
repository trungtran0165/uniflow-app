import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Pencil } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ContentLoader from "@/components/common/ContentLoader";
import { adminCoursesAPI, adminProgramsAPI } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Program = {
  _id: string;
  code: string;
  name: string;
  cohort: string;
  majorLabel: string;
};

type Course = {
  _id: string;
  code: string;
  name: string;
  credits: number;
  description?: string;
  programId?: Program | null;
  prerequisites?: Array<{ _id: string; code: string; name: string }>;
};

export default function AdminCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("unassigned");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    theoryCredits: 3,
    practiceCredits: 0,
    description: "",
    prerequisites: [] as string[], // courseIds
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: () => adminProgramsAPI.getAll(),
  });

  const courseFilters = useMemo(() => {
    const f: { programId?: string; unassigned?: boolean; keyword?: string } = {};
    if (programFilter === "unassigned") f.unassigned = true;
    else if (programFilter !== "all") f.programId = programFilter;
    if (keyword.trim()) f.keyword = keyword.trim();
    return f;
  }, [programFilter, keyword]);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses", courseFilters],
    queryFn: () => adminCoursesAPI.getAll(courseFilters),
  });

  // Always load all courses for prerequisite picking (independent of current filters)
  const { data: allCourses = [] } = useQuery({
    queryKey: ["admin-courses-all"],
    queryFn: () => adminCoursesAPI.getAll({}),
    enabled: isEditOpen,
  });

  const allCoursesIndex = useMemo(() => {
    const map = new Map<string, Course>();
    (allCourses as Course[]).forEach((c) => map.set(c._id, c));
    return map;
  }, [allCourses]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => adminCoursesAPI.create(payload),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã tạo học phần" });
      setIsEditOpen(false);
      setEditingCourse(null);
      setForm({ code: "", name: "", credits: 3, description: "", prerequisites: [] });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (err: any) =>
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tạo học phần",
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: any }) =>
      adminCoursesAPI.update(courseId, payload),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã cập nhật học phần" });
      setIsEditOpen(false);
      setEditingCourse(null);
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (err: any) =>
      toast({
        title: "Lỗi",
        description: err.message || "Không thể cập nhật học phần",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (courseId: string) => adminCoursesAPI.delete(courseId),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xoá học phần" });
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (err: any) =>
      toast({
        title: "Lỗi",
        description: err.message || "Không thể xoá học phần",
        variant: "destructive",
      }),
  });

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ code: "", name: "", theoryCredits: 3, practiceCredits: 0, description: "", prerequisites: [] });
    setIsEditOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      code: course.code || "",
      name: course.name || "",
      theoryCredits: (course as any).theoryCredits ?? course.credits ?? 3,
      practiceCredits: (course as any).practiceCredits ?? 0,
      description: course.description || "",
      prerequisites: (course.prerequisites || []).map((p) => p._id),
    });
    setIsEditOpen(true);
  };

  const selectablePrereqs: Course[] = useMemo(() => {
    const list = allCourses as Course[];
    return list.filter((c) => c._id !== editingCourse?._id);
  }, [allCourses, editingCourse?._id]);

  const selectedPrereqLabels = useMemo(() => {
    const labels = form.prerequisites
      .map((id) => allCoursesIndex.get(id))
      .filter(Boolean)
      .map((c) => (c as Course).code);
    return labels.join(", ");
  }, [form.prerequisites, allCoursesIndex]);

  const submit = () => {
    const theory = Number(form.theoryCredits);
    const practice = Number(form.practiceCredits);
    const credits = theory + practice;

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      credits,
      theoryCredits: theory,
      practiceCredits: practice,
      description: form.description,
      prerequisites: form.prerequisites,
      // keep unassigned by default; assignment happens in CTĐT page
    };

    if (!payload.code || !payload.name || !payload.credits) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng nhập mã môn, tên môn, số tín chỉ.",
        variant: "destructive",
      });
      return;
    }

    if (payload.theoryCredits < 0 || payload.practiceCredits < 0) {
      toast({
        title: "Dữ liệu không hợp lệ",
        description: "Tín chỉ lý thuyết / thực hành phải >= 0.",
        variant: "destructive",
      });
      return;
    }

    if (editingCourse?._id) {
      updateMutation.mutate({ courseId: editingCourse._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <section aria-labelledby="admin-courses-heading" className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 id="admin-courses-heading" className="text-xl font-semibold md:text-2xl">
            Quản lý học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo học phần (mã môn), chỉnh sửa thông tin và thiết lập điều kiện tiên quyết (vd: CTRR → XSTK).
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo học phần
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">Danh sách học phần</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo mã / tên"
                  className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="h-10 w-[260px] text-sm">
                  <SelectValue placeholder="Lọc theo CTĐT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Chưa gán CTĐT</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {programs.map((p: any) => (
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
            <ContentLoader size="card" title="Đang tải dữ liệu…" subtitle="Đang lấy danh sách học phần" />
          ) : (courses as Course[]).length === 0 ? (
            <p className="text-muted-foreground">Chưa có học phần nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 text-left font-medium">Mã</th>
                    <th className="py-2 pr-4 text-left font-medium">Tên học phần</th>
                    <th className="py-2 pr-4 text-left font-medium">TC (LT/TH)</th>
                    <th className="py-2 pr-4 text-left font-medium">CTĐT</th>
                    <th className="py-2 pr-4 text-left font-medium">Tiên quyết</th>
                    <th className="py-2 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(courses as Course[]).map((c) => (
                    <tr key={c._id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 align-top font-semibold">{c.code}</td>
                      <td className="py-2 pr-4 align-top">
                        <div className="space-y-0.5">
                          <div className="font-medium">{c.name}</div>
                          {c.description ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2 pr-4 align-top">
                        <span className="font-medium">{c.credits}</span>{" "}
                        <span className="text-xs text-muted-foreground">
                          ({(c as any).theoryCredits ?? c.credits}/{(c as any).practiceCredits ?? 0})
                        </span>
                      </td>
                      <td className="py-2 pr-4 align-top">
                        {c.programId ? (
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {c.programId.code} • {c.programId.cohort}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Chưa gán</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">
                        {(c.prerequisites || []).length === 0
                          ? "—"
                          : (c.prerequisites || []).map((p) => p.code).join(", ")}
                      </td>
                      <td className="py-2 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openEdit(c)}
                            title="Sửa học phần"
                            aria-label="Sửa học phần"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(c._id)}
                            disabled={deleteMutation.isPending}
                            title="Xoá học phần"
                            aria-label="Xoá học phần"
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
            <DialogTitle>{editingCourse ? `Sửa học phần ${editingCourse.code}` : "Tạo học phần mới"}</DialogTitle>
            <DialogDescription>Thiết lập thông tin học phần và điều kiện tiên quyết.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mã học phần</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))}
                placeholder="VD: CTRR"
                disabled={Boolean(editingCourse)} // avoid breaking references
              />
            </div>
            <div className="space-y-2">
              <Label>Tổng tín chỉ</Label>
              <Input type="number" value={Number(form.theoryCredits) + Number(form.practiceCredits)} disabled />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Tên học phần</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="VD: Cấu trúc rời rạc"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Mô tả</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="(tuỳ chọn)"
              />
            </div>

            <div className="space-y-2">
              <Label>Tín chỉ lý thuyết</Label>
              <Input
                type="number"
                min={0}
                value={form.theoryCredits}
                onChange={(e) => setForm((s) => ({ ...s, theoryCredits: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tín chỉ thực hành</Label>
              <Input
                type="number"
                min={0}
                value={form.practiceCredits}
                onChange={(e) => setForm((s) => ({ ...s, practiceCredits: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Điều kiện tiên quyết</Label>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <Input value={selectedPrereqLabels || "—"} readOnly />
                <Select
                  value=""
                  onValueChange={(id) => {
                    if (!id) return;
                    setForm((s) => {
                      const exists = s.prerequisites.includes(id);
                      return { ...s, prerequisites: exists ? s.prerequisites : [...s.prerequisites, id] };
                    });
                  }}
                >
                  <SelectTrigger className="h-10 w-full md:w-[260px] text-sm">
                    <SelectValue placeholder="Thêm tiên quyết" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectablePrereqs.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.prerequisites.map((id) => {
                    const c = allCoursesIndex.get(id);
                    const label = c ? `${c.code}` : id;
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                          setForm((s) => ({ ...s, prerequisites: s.prerequisites.filter((x) => x !== id) }))
                        }
                        title="Click để gỡ"
                      >
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Ví dụ: chọn CTRR làm tiên quyết của XSTK → SV phải đậu CTRR mới đăng ký được XSTK.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingCourse ? (updateMutation.isPending ? "Đang lưu…" : "Lưu") : createMutation.isPending ? "Đang tạo…" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}


