import { useState } from "react";
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
import { enrollmentRows, registrationHistory } from "@/mocks/student";
import { useToast } from "@/hooks/use-toast";
import { History, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const StudentRegistrationManage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState(enrollmentRows);
  const [pendingCancel, setPendingCancel] = useState<(typeof rows)[number] | null>(null);

  const credits = rows.reduce((sum, row) => sum + row.credits, 0);

  const handleCancel = () => {
    if (pendingCancel) {
      setRows((prev) => prev.filter((row) => row.id !== pendingCancel.id));
      toast({
        title: "Hủy đăng ký thành công",
        description: `${pendingCancel.code} đã được gỡ khỏi danh sách.`,
      });
      setPendingCancel(null);
    }
  };

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
              Bao gồm cả các lớp đang ở trạng thái chờ duyệt/waitlist (mô phỏng).
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current">
              <TabsList className="bg-transparent">
                <TabsTrigger value="current" className="rounded-full bg-muted px-4 text-xs">
                  Đang học ({rows.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full bg-muted px-4 text-xs">
                  Lịch sử gần đây
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="pt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2 text-left font-medium">Mã lớp</th>
                        <th className="py-2 text-left font-medium">Học phần</th>
                        <th className="py-2 text-left font-medium">Lịch học</th>
                        <th className="py-2 text-left font-medium">Trạng thái</th>
                        <th className="py-2 text-right font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b last:border-b-0">
                          <td className="py-2 pr-4 align-top font-semibold text-foreground">{row.code}</td>
                          <td className="py-2 pr-4 align-top">
                            <p className="font-medium text-foreground">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.credits} tín chỉ • {row.section}</p>
                          </td>
                          <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{row.schedule}</td>
                          <td className="py-2 pr-4 align-top">
                            <Badge variant={row.status === "registered" ? "secondary" : "outline"}>
                              {row.status === "registered" ? "Đã đăng ký" : "Danh sách chờ"}
                            </Badge>
                          </td>
                          <td className="py-2 align-top text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setPendingCancel(row)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hủy
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-3 pt-4">
                {registrationHistory.slice(0, 4).map((log) => (
                  <div key={log.id} className="rounded-lg border bg-card/80 p-3 text-sm">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{log.timestamp}</span>
                      <Badge variant={log.result === "success" ? "secondary" : "destructive"}>
                        {log.result === "success" ? "Thành công" : "Thất bại"}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {log.action === "register" ? "Đăng ký" : "Hủy"} {log.classCode}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.className}</p>
                    {log.reason ? <p className="text-xs text-primary">Lý do: {log.reason}</p> : null}
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full text-sm">
                  <Link to="/student/registration/history">Xem thêm lịch sử</Link>
                </Button>
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
              <p>• Min 14 TC · Max 24 TC</p>
              <p>• Hủy lớp sau 15/12 sẽ cần phê duyệt của Cố vấn</p>
              <p>• Các lớp trong DS chờ tự động huỷ nếu không được duyệt trước 18/12</p>
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
              Học phần {pendingCancel?.code} – {pendingCancel?.name} sẽ bị gỡ khỏi danh sách. Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingCancel(null)}>Quay lại</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Hủy đăng ký</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StudentRegistrationManage;

