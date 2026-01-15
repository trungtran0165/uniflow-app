import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { History, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationAPI, authAPI } from "@/lib/api";
import ContentLoader from "@/components/common/ContentLoader";
import { Checkbox } from "@/components/ui/checkbox";

const StudentRegistrationManage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingCancel, setPendingCancel] = useState<any | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);

  // Get current user to find studentId
  const { data: userData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authAPI.me(),
  });

  useEffect(() => {
    // Use student.id (Student._id) if available, otherwise fallback to user.id
    if (userData?.student?.id) {
      setStudentId(userData.student.id);
    } else if (userData?.user?.id) {
      // Fallback: use user.id (will be resolved by backend helper function)
      setStudentId(userData.user.id);
    }
  }, [userData]);

  // Fetch enrollments
  const { data: enrollmentsData = [], isLoading } = useQuery({
    queryKey: ["registration-enrollments", studentId],
    queryFn: () => registrationAPI.getEnrollments(studentId!),
    enabled: !!studentId,
  });

  // Fetch registration history
  const { data: historyData = [] } = useQuery({
    queryKey: ["registration-history", studentId],
    queryFn: () => registrationAPI.getHistory(studentId!),
    enabled: !!studentId,
  });

  // Fetch registration summary
  const { data: summaryData } = useQuery({
    queryKey: ["registration-summary", studentId],
    queryFn: () => registrationAPI.getSummary(studentId!),
    enabled: !!studentId,
  });

  // Cancel enrollment mutation
  const cancelMutation = useMutation({
    mutationFn: (enrollmentId: string) => registrationAPI.cancelEnrollment(enrollmentId),
    onSuccess: () => {
      toast({
        title: "Hủy đăng ký thành công",
        description: "Lớp đã được gỡ khỏi danh sách.",
      });
      setPendingCancel(null);
      queryClient.invalidateQueries({ queryKey: ["registration-enrollments", studentId] });
      queryClient.invalidateQueries({ queryKey: ["registration-history", studentId] });
      queryClient.invalidateQueries({ queryKey: ["registration-summary", studentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hủy đăng ký thất bại",
        description: error.message || "Không thể hủy đăng ký",
        variant: "destructive",
      });
    },
  });

  const bulkCancelMutation = useMutation({
    mutationFn: async (enrollmentIds: string[]) => {
      const results = await Promise.allSettled(
        enrollmentIds.map((id) => registrationAPI.cancelEnrollment(id))
      );
      return results;
    },
    onSuccess: (results) => {
      const failed = results.filter((r) => r.status === "rejected").length;
      const success = results.length - failed;
      toast({
        title: "Hủy đăng ký",
        description: failed === 0 ? `Đã hủy ${success} lớp` : `Đã hủy ${success} lớp, lỗi ${failed} lớp`,
        variant: failed === 0 ? "default" : "destructive",
      });
      setSelectedEnrollmentIds([]);
      setBulkCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["registration-enrollments", studentId] });
      queryClient.invalidateQueries({ queryKey: ["registration-history", studentId] });
      queryClient.invalidateQueries({ queryKey: ["registration-summary", studentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hủy đăng ký thất bại",
        description: error.message || "Không thể hủy đăng ký",
        variant: "destructive",
      });
    },
  });

  const credits = enrollmentsData.reduce((sum: number, row: any) => {
    return sum + (row.credits || row.course?.credits || row.classId?.courseId?.credits || 0);
  }, 0);

  const summary = summaryData || {
    minCredits: 14,
    maxCredits: 24,
    deadline: "N/A",
  };

  const handleCancel = () => {
    if (pendingCancel) {
      cancelMutation.mutate(pendingCancel._id || pendingCancel.id);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEnrollmentIds(enrollmentsData.map((row: any) => row._id || row.id));
    } else {
      setSelectedEnrollmentIds([]);
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedEnrollmentIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  if (isLoading || !studentId) {
    return <ContentLoader title="Đang tải dữ liệu…" subtitle="Đang lấy đăng ký hiện tại của bạn" />;
  }

  return (
    <section aria-labelledby="student-registration-manage-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="student-registration-manage-heading" className="text-xl font-semibold md:text-2xl">
            Quản lý đăng ký cá nhân
          </h1>
          <p className="text-sm text-muted-foreground">
            Xem danh sách lớp đã đăng ký, hủy lớp khi cần và đối chiếu nhật ký thao tác.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2 text-sm">
          <Link to="/student/registration/history">
            <History className="h-4 w-4" />
            Xem toàn bộ lịch sử
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)]">
        <Card className="glass-panel interactive-card">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-base">Lớp đã đăng ký trong kỳ</CardTitle>
            <p className="text-xs text-muted-foreground">
              Bao gồm cả các lớp đang ở trạng thái chờ duyệt/waitlist.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current">
              <TabsList className="bg-transparent">
                <TabsTrigger value="current" className="rounded-full bg-muted px-4 text-xs">
                  Đang học ({enrollmentsData.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full bg-muted px-4 text-xs">
                  Lịch sử gần đây
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="pt-4">
                {enrollmentsData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa đăng ký lớp nào</p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox
                          checked={selectedEnrollmentIds.length === enrollmentsData.length}
                          onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
                          aria-label="Chọn tất cả lớp"
                        />
                        <span>Chọn tất cả</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={selectedEnrollmentIds.length === 0}
                        onClick={() => setBulkCancelOpen(true)}
                      >
                        Hủy {selectedEnrollmentIds.length} lớp
                      </Button>
                    </div>
                    <table className="min-w-full text-sm">
                      <thead className="border-b text-xs text-muted-foreground">
                        <tr>
                          <th className="py-2 text-left font-medium">Chọn</th>
                          <th className="py-2 text-left font-medium">Mã lớp</th>
                          <th className="py-2 text-left font-medium">Học phần</th>
                          <th className="py-2 text-left font-medium">Lịch học</th>
                          <th className="py-2 text-left font-medium">Trạng thái</th>
                          <th className="py-2 text-right font-medium">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollmentsData.map((row: any) => {
                          const classCode = row.classId?.code || row.code || "N/A";
                          const courseName = row.classId?.courseId?.name || row.courseName || "N/A";
                          const credits = row.credits || row.classId?.courseId?.credits || 0;
                          const schedule = row.classId?.schedule?.[0] || {};
                          const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                          const scheduleStr = schedule.dayOfWeek !== undefined
                            ? `${dayNames[schedule.dayOfWeek]} (${schedule.period}) • ${schedule.roomId?.code || "N/A"}`
                            : "Chưa có lịch";
                          const status = row.status || "registered";

                          return (
                            <tr key={row._id || row.id} className="border-b last:border-b-0">
                              <td className="py-2 pr-3 align-top">
                                <Checkbox
                                  checked={selectedEnrollmentIds.includes(row._id || row.id)}
                                  onCheckedChange={(v) => toggleSelectOne(row._id || row.id, Boolean(v))}
                                  aria-label={`Chọn lớp ${classCode}`}
                                />
                              </td>
                              <td className="py-2 pr-4 align-top font-semibold text-foreground">{classCode}</td>
                              <td className="py-2 pr-4 align-top">
                                <p className="font-medium text-foreground">{courseName}</p>
                                <p className="text-xs text-muted-foreground">{credits} tín chỉ</p>
                              </td>
                              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{scheduleStr}</td>
                              <td className="py-2 pr-4 align-top">
                                <Badge variant={status === "registered" ? "secondary" : "outline"}>
                                  {status === "registered" ? "Đã đăng ký" : status === "waitlist" ? "Danh sách chờ" : status}
                                </Badge>
                              </td>
                              <td className="py-2 align-top text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setPendingCancel(row)}
                                  disabled={cancelMutation.isPending}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hủy
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-3 pt-4">
                {historyData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có lịch sử</p>
                ) : (
                  <>
                    {historyData.slice(0, 4).map((log: any) => (
                      <div key={log._id || log.id} className="rounded-lg border bg-card/80 p-3 text-sm">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{log.timestamp || log.createdAt}</span>
                          <Badge variant={log.result === "success" ? "secondary" : "destructive"}>
                            {log.result === "success" ? "Thành công" : "Thất bại"}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {log.action === "register" ? "Đăng ký" : "Hủy"} {log.classCode || log.classId?.code}
                        </p>
                        <p className="text-xs text-muted-foreground">{log.className || log.classId?.courseId?.name}</p>
                        {log.reason ? <p className="text-xs text-primary">Lý do: {log.reason}</p> : null}
                      </div>
                    ))}
                    <Button asChild variant="outline" className="w-full text-sm">
                      <Link to="/student/registration/history">Xem thêm lịch sử</Link>
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tổng hợp tín chỉ & chính sách</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-xl bg-secondary/60 p-4">
              <p className="stat-label">Tín chỉ hiện tại</p>
              <p className="text-2xl font-semibold text-foreground">{credits} TC</p>
              <p className="text-xs text-muted-foreground">Bao gồm cả các lớp đang chờ xác nhận.</p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Min {summary.minCredits || 14} TC · Max {summary.maxCredits || 24} TC</p>
              {summary.deadline && summary.deadline !== 'N/A' ? (
                <>
                  <p>• Hạn cuối đăng ký: {summary.deadline}</p>
                  <p>• Sau hạn cuối, không thể hủy/thay đổi lớp (cần liên hệ cố vấn)</p>
                </>
              ) : (
                <p>• Chưa có đợt đăng ký đang mở</p>
              )}
            </div>
            <div className="rounded-xl border border-dashed p-3 text-xs">
              <p className="font-semibold text-foreground">Mẹo</p>
              <p>Ưu tiên giữ slot những lớp bắt buộc, sau đó cân nhắc học phần tự chọn bổ sung.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(pendingCancel)} onOpenChange={(open) => !open && setPendingCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đăng ký?</AlertDialogTitle>
            <AlertDialogDescription>
              Học phần {pendingCancel?.classId?.code || pendingCancel?.code} – {pendingCancel?.classId?.courseId?.name || pendingCancel?.courseName} sẽ bị gỡ khỏi danh sách. Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCancel(null)}>Quay lại</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Đang xử lý..." : "Hủy đăng ký"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkCancelOpen} onOpenChange={setBulkCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy nhiều lớp?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp hủy {selectedEnrollmentIds.length} lớp đã chọn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkCancelOpen(false)}>Quay lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkCancelMutation.mutate(selectedEnrollmentIds)}
              disabled={bulkCancelMutation.isPending}
            >
              {bulkCancelMutation.isPending ? "Đang xử lý..." : "Hủy đăng ký"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StudentRegistrationManage;
