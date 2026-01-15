import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { registrationHistory } from "@/mocks/student";
import { FileDown, Filter } from "lucide-react";

const StudentRegistrationHistory = () => {
  const [actionFilter, setActionFilter] = useState<"all" | "register" | "cancel">("all");
  const [resultFilter, setResultFilter] = useState<"all" | "success" | "failed">("all");

  const filteredHistory = useMemo(
    () =>
      registrationHistory.filter((log) => {
        const matchAction = actionFilter === "all" || log.action === actionFilter;
        const matchResult = resultFilter === "all" || log.result === resultFilter;
        return matchAction && matchResult;
      }),
    [actionFilter, resultFilter],
  );

  return (
    <section aria-labelledby="student-registration-history-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="student-registration-history-heading" className="text-xl font-semibold md:text-2xl">
            Lịch sử đăng ký học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Thống kê toàn bộ thao tác đăng ký/hủy, phục vụ đối soát khi cần hỗ trợ từ phòng đào tạo.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Xuất CSV (demo)
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Bộ lọc</CardTitle>
            <p className="text-xs text-muted-foreground">Lọc theo hành động và kết quả để tìm log cần tra cứu.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={actionFilter} onValueChange={(value: typeof actionFilter) => setActionFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="register">Đăng ký</SelectItem>
                <SelectItem value="cancel">Hủy đăng ký</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resultFilter} onValueChange={(value: typeof resultFilter) => setResultFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kết quả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kết quả</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2 text-xs md:text-sm"
              onClick={() => {
                setActionFilter("all");
                setResultFilter("all");
              }}
            >
              <Filter className="h-4 w-4" />
              Đặt lại lọc
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Không có bản ghi nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredHistory.map((log) => (
              <div key={log.id} className="rounded-xl border bg-card/80 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {log.action === "register" ? "Đăng ký" : "Hủy"} {log.classCode}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.className}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="pill-badge bg-muted text-foreground">{log.timestamp}</span>
                    <span
                      className={`pill-badge ${
                        log.result === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {log.result === "success" ? "Thành công" : "Thất bại"}
                    </span>
                  </div>
                </div>
                {log.reason ? <p className="mt-2 text-xs text-primary">Lý do: {log.reason}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default StudentRegistrationHistory;

