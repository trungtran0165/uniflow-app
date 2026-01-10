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
import { CalendarDays, Filter, Plus } from "lucide-react";
import { adminRegistrationWindowsAPI, adminSemestersAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface RegistrationWindow {
  _id: string;
  name: string;
  semesterId: {
    _id: string;
    name: string;
    code: string;
  };
  startDate: string;
  endDate: string;
  minCredits: number;
  maxCredits: number;
  targetCohorts: string[];
  targetMajors: string[];
  status: 'draft' | 'open' | 'closed';
  rules: {
    checkPrerequisites: boolean;
    checkScheduleConflict: boolean;
    checkCreditLimit: boolean;
    allowWaitlist: boolean;
  };
}

const AdminRegistrationWindows = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState<RegistrationWindow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    semesterId: "",
    startDate: "",
    endDate: "",
    minCredits: 14,
    maxCredits: 24,
    targetCohorts: [] as string[],
    targetMajors: [] as string[],
    rules: {
      checkPrerequisites: true,
      checkScheduleConflict: true,
      checkCreditLimit: true,
      allowWaitlist: true,
    },
  });

  // Fetch registration windows
  const { data: windows = [], isLoading } = useQuery({
    queryKey: ["admin-registration-windows"],
    queryFn: () => adminRegistrationWindowsAPI.getAll(),
  });

  // Fetch semesters
  const { data: semesters = [] } = useQuery({
    queryKey: ["admin-semesters"],
    queryFn: () => adminSemestersAPI.getAll(),
  });

  // Create window mutation
  const createWindowMutation = useMutation({
    mutationFn: (data: any) => adminRegistrationWindowsAPI.create(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo đợt đăng ký mới",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-registration-windows"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đợt đăng ký",
        variant: "destructive",
      });
    },
  });

  // Update window mutation
  const updateWindowMutation = useMutation({
    mutationFn: ({ windowId, data }: { windowId: string; data: any }) =>
      adminRegistrationWindowsAPI.update(windowId, data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật đợt đăng ký",
      });
      setIsEditDialogOpen(false);
      setEditingWindow(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-registration-windows"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật đợt đăng ký",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ windowId, status }: { windowId: string; status: string }) =>
      adminRegistrationWindowsAPI.updateStatus(windowId, status),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-registration-windows"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      semesterId: "",
      startDate: "",
      endDate: "",
      minCredits: 14,
      maxCredits: 24,
      targetCohorts: [],
      targetMajors: [],
      rules: {
        checkPrerequisites: true,
        checkScheduleConflict: true,
        checkCreditLimit: true,
        allowWaitlist: true,
      },
    });
  };

  const handleCreateWindow = () => {
    if (!formData.name || !formData.semesterId || !formData.startDate || !formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    createWindowMutation.mutate({
      name: formData.name,
      semesterId: formData.semesterId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      minCredits: formData.minCredits,
      maxCredits: formData.maxCredits,
      targetCohorts: formData.targetCohorts,
      targetMajors: formData.targetMajors,
      rules: formData.rules,
    });
  };

  const handleEditWindow = (window: RegistrationWindow) => {
    setEditingWindow(window);
    setFormData({
      name: window.name,
      semesterId: window.semesterId._id,
      startDate: new Date(window.startDate).toISOString().split('T')[0],
      endDate: new Date(window.endDate).toISOString().split('T')[0],
      minCredits: window.minCredits,
      maxCredits: window.maxCredits,
      targetCohorts: window.targetCohorts || [],
      targetMajors: window.targetMajors || [],
      rules: window.rules,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateWindow = () => {
    if (!editingWindow) return;

    updateWindowMutation.mutate({
      windowId: editingWindow._id,
      data: {
        name: formData.name,
        semesterId: formData.semesterId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        minCredits: formData.minCredits,
        maxCredits: formData.maxCredits,
        targetCohorts: formData.targetCohorts,
        targetMajors: formData.targetMajors,
        rules: formData.rules,
      },
    });
  };

  const handleUpdateStatus = (windowId: string, newStatus: string) => {
    updateStatusMutation.mutate({ windowId, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const activeWindow = windows.find((w: RegistrationWindow) => w.status === 'open');

  return (
    <section aria-labelledby="admin-registration-windows-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-registration-windows-heading" className="text-xl font-semibold md:text-2xl">
            Đợt đăng ký học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình đợt ĐKHP, giới hạn tín chỉ và phạm vi đối tượng.
          </p>
        </div>
        <Button
          size="sm"
          className="flex items-center gap-2 text-xs md:text-sm"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Tạo đợt ĐKHP mới
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : windows.length === 0 ? (
        <Card className="glass-panel interactive-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa có đợt đăng ký nào. Nhấn "Tạo đợt ĐKHP mới" để tạo.
          </CardContent>
        </Card>
      ) : (
        <>
          {activeWindow && (
            <Card className="glass-panel interactive-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">Đợt hiện tại (Đang mở)</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {activeWindow.semesterId?.name || "N/A"}
                  </p>
                </div>
                <CalendarDays className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-3 text-xs md:text-sm">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <p className="stat-label">Thời gian</p>
                    <p className="font-semibold text-foreground">
                      {formatDate(activeWindow.startDate)} – {formatDate(activeWindow.endDate)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <p className="stat-label">Giới hạn tín chỉ</p>
                    <p className="font-semibold text-foreground">
                      {activeWindow.minCredits} - {activeWindow.maxCredits} TC / SV
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <p className="stat-label">Đối tượng</p>
                    <p className="font-semibold text-foreground">
                      {activeWindow.targetCohorts.length > 0
                        ? `Khóa ${activeWindow.targetCohorts.join(', ')}`
                        : "Tất cả khóa"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    Quy tắc: {activeWindow.rules.checkPrerequisites ? "Tiên quyết" : ""}{" "}
                    {activeWindow.rules.checkScheduleConflict ? "Trùng lịch" : ""}{" "}
                    {activeWindow.rules.checkCreditLimit ? "Giới hạn TC" : ""}{" "}
                    {activeWindow.rules.allowWaitlist ? "Waitlist" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="pill-badge">Đang mở</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(activeWindow._id, 'closed')}
                    >
                      Đóng đợt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditWindow(activeWindow)}
                    >
                      Sửa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-panel interactive-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tất cả đợt đăng ký</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {windows.map((window: RegistrationWindow) => (
                <div
                  key={window._id}
                  className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{window.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(window.startDate)} – {formatDate(window.endDate)} •{" "}
                      {window.semesterId?.name || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="pill-badge">
                      {window.status === 'open' ? 'Đang mở' : window.status === 'closed' ? 'Đã đóng' : 'Draft'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditWindow(window)}
                    >
                      Sửa
                    </Button>
                    {window.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(window._id, 'open')}
                      >
                        Mở đợt
                      </Button>
                    )}
                    {window.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(window._id, 'closed')}
                      >
                        Đóng đợt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo đợt đăng ký mới</DialogTitle>
            <DialogDescription>
              Cấu hình thời gian, giới hạn tín chỉ và đối tượng cho đợt đăng ký học phần.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên đợt</Label>
              <Input
                id="name"
                placeholder="VD: ĐKHP HK2 2025-2026"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
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
                  {semesters.map((semester: any) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      {semester.name} ({semester.code})
                    </SelectItem>
                  ))}
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
                <Label htmlFor="endDate">Ngày kết thúc (Hạn cuối)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minCredits">Tín chỉ tối thiểu</Label>
                <Input
                  id="minCredits"
                  type="number"
                  min="0"
                  value={formData.minCredits}
                  onChange={(e) => setFormData({ ...formData, minCredits: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxCredits">Tín chỉ tối đa</Label>
                <Input
                  id="maxCredits"
                  type="number"
                  min="1"
                  value={formData.maxCredits}
                  onChange={(e) => setFormData({ ...formData, maxCredits: parseInt(e.target.value) || 24 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetCohorts">Khóa áp dụng (để trống = tất cả)</Label>
              <Input
                id="targetCohorts"
                placeholder="VD: 2022,2023,2024 (phân cách bằng dấu phẩy)"
                value={formData.targetCohorts.join(',')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetCohorts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Để trống để cho phép tất cả khóa. Nhập các khóa phân cách bằng dấu phẩy (VD: 2022,2023,2024)
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Quy tắc kiểm tra</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.checkPrerequisites}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, checkPrerequisites: e.target.checked },
                      })
                    }
                  />
                  Kiểm tra điều kiện tiên quyết
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.checkScheduleConflict}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, checkScheduleConflict: e.target.checked },
                      })
                    }
                  />
                  Kiểm tra trùng lịch học
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.checkCreditLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, checkCreditLimit: e.target.checked },
                      })
                    }
                  />
                  Kiểm tra giới hạn tín chỉ
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.allowWaitlist}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, allowWaitlist: e.target.checked },
                      })
                    }
                  />
                  Cho phép danh sách chờ (Waitlist)
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateWindow} disabled={createWindowMutation.isPending}>
              {createWindowMutation.isPending ? "Đang tạo..." : "Tạo đợt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa đợt đăng ký</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin đợt đăng ký học phần.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Tên đợt</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-semesterId">Học kỳ</Label>
              <Select
                value={formData.semesterId}
                onValueChange={(value) => setFormData({ ...formData, semesterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester: any) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      {semester.name} ({semester.code})
                    </SelectItem>
                  ))}
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
                <Label htmlFor="edit-endDate">Ngày kết thúc (Hạn cuối)</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-minCredits">Tín chỉ tối thiểu</Label>
                <Input
                  id="edit-minCredits"
                  type="number"
                  min="0"
                  value={formData.minCredits}
                  onChange={(e) => setFormData({ ...formData, minCredits: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-maxCredits">Tín chỉ tối đa</Label>
                <Input
                  id="edit-maxCredits"
                  type="number"
                  min="1"
                  value={formData.maxCredits}
                  onChange={(e) => setFormData({ ...formData, maxCredits: parseInt(e.target.value) || 24 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-targetCohorts">Khóa áp dụng (để trống = tất cả)</Label>
              <Input
                id="edit-targetCohorts"
                placeholder="VD: 2022,2023,2024"
                value={formData.targetCohorts.join(',')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetCohorts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Quy tắc kiểm tra</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.checkPrerequisites}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, checkPrerequisites: e.target.checked },
                      })
                    }
                  />
                  Kiểm tra điều kiện tiên quyết
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.checkScheduleConflict}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, checkScheduleConflict: e.target.checked },
                      })
                    }
                  />
                  Kiểm tra trùng lịch học
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.checkCreditLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, checkCreditLimit: e.target.checked },
                      })
                    }
                  />
                  Kiểm tra giới hạn tín chỉ
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rules.allowWaitlist}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, allowWaitlist: e.target.checked },
                      })
                    }
                  />
                  Cho phép danh sách chờ (Waitlist)
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateWindow} disabled={updateWindowMutation.isPending}>
              {updateWindowMutation.isPending ? "Đang cập nhật..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AdminRegistrationWindows;
