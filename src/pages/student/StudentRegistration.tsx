import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, Filter, Info, Search } from "lucide-react";
import SeatIndicator from "@/components/student/SeatIndicator";
import { mockRegistrationSummary, openClasses, OpenClassRow } from "@/mocks/student";
import { Badge } from "@/components/ui/badge";

const StudentRegistration = () => {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [faculty, setFaculty] = useState("tat-ca");
  const [blockingClass, setBlockingClass] = useState<OpenClassRow | null>(null);

  const filterOptions = useMemo(
    () => Array.from(new Set(openClasses.map((row) => row.faculty))),
    [],
  );

  const filtered = openClasses.filter((row) => {
    const matchKeyword =
      !keyword ||
      row.code.toLowerCase().includes(keyword.toLowerCase()) ||
      row.name.toLowerCase().includes(keyword.toLowerCase());
    const matchFaculty = faculty === "tat-ca" || row.faculty === faculty;
    return matchKeyword && matchFaculty;
  });

  const handleRegister = (row: OpenClassRow) => {
    if (row.status !== "available") {
      setBlockingClass(row);
      return;
    }

    toast({
      title: "Đăng ký thành công",
      description: `${row.code} – ${row.name} đã được thêm vào danh sách lớp của bạn.`,
    });
  };

  const errorMessageMap: Record<Exclude<OpenClassRow["status"], "available">, string> = {
    full: "Lớp đã đủ sĩ số. Chuyển sang danh sách chờ hoặc chọn lớp khác.",
    conflict: "Lịch học trùng với lớp bạn đã đăng ký. Vui lòng chọn lớp khác.",
    prerequisite: "Bạn chưa hoàn thành học phần tiên quyết. Liên hệ cố vấn nếu cần hỗ trợ.",
    "credit-limit": "Đăng ký vượt quá số tín chỉ tối đa trong đợt này.",
  };

  const blockingMessage =
    blockingClass && blockingClass.status !== "available"
      ? errorMessageMap[blockingClass.status]
      : "";

  return (
    <section aria-labelledby="student-registration-heading" className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 id="student-registration-heading" className="text-xl font-semibold md:text-2xl">
            Đăng ký học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm lớp đang mở, kiểm tra ràng buộc và đăng ký vào lớp phù hợp. Dữ liệu hiện tại là mô phỏng.
          </p>
        </div>
        <div className="pill-badge flex items-center gap-2">
          <Info className="h-3.5 w-3.5" />
          Đợt ĐKHP HK2 2025–2026 đang mở đến 23:59 ngày 20/12.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.2fr)]">
        <Card className="glass-panel interactive-card">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Danh sách lớp đang mở</CardTitle>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                  <span className="inline-flex items-center gap-1">•</span>
                  <span>Trạng thái cập nhật thời gian thực</span>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo mã môn / tên môn"
                  className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>

              <Select value={faculty} onValueChange={setFaculty}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tat-ca">Tất cả khoa</SelectItem>
                  {filterOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center gap-2 text-xs md:text-sm">
                <Filter className="h-4 w-4" />
                Bộ lọc nâng cao
              </Button>
            </div>
          </CardHeader>

          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 text-left font-medium">Mã lớp</th>
                  <th className="py-2 pr-4 text-left font-medium">Học phần</th>
                  <th className="py-2 pr-4 text-left font-medium">Khoa</th>
                  <th className="py-2 pr-4 text-left font-medium">TC</th>
                  <th className="py-2 pr-4 text-left font-medium">Sĩ số</th>
                  <th className="py-2 pr-4 text-left font-medium">Thời gian / Phòng</th>
                  <th className="py-2 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 align-top font-medium text-foreground">{row.code}</td>
                    <td className="py-2 pr-4 align-top">
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">Giảng viên: {row.instructor}</p>
                      </div>
                    </td>
                    <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{row.faculty}</td>
                    <td className="py-2 pr-4 align-top text-center">{row.credits}</td>
                    <td className="py-2 pr-4 align-top">
                      <SeatIndicator enrolled={row.enrolled} capacity={row.capacity} status={row.status} />
                    </td>
                    <td className="py-2 pr-4 align-top text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <p>{row.time}</p>
                        {row.note ? <p className="text-[11px] text-primary">{row.note}</p> : null}
                      </div>
                    </td>
                    <td className="py-2 align-top text-right">
                      <Button
                        size="sm"
                        variant={row.status === "available" ? "default" : "outline"}
                        onClick={() => handleRegister(row)}
                      >
                        {row.status === "available" && "Chọn đăng ký"}
                        {row.status === "full" && "Đã đầy"}
                        {row.status === "conflict" && "Trùng lịch"}
                        {row.status === "prerequisite" && "Thiếu tiên quyết"}
                        {row.status === "credit-limit" && "Vượt tín chỉ"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Tóm tắt đăng ký hiện tại</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Dữ liệu minh hoạ cho phần "Quản lý ĐKHP cá nhân" &amp; "Tra cứu CTĐT".
                </p>
              </div>
              <BookOpenCheck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary px-3 py-2">
                <p className="stat-label">Tín chỉ trong kỳ</p>
                  <p className="stat-value text-xl">{mockRegistrationSummary.minCredits + 4}</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-2">
                <p className="stat-label">Tín chỉ còn trống</p>
                  <p className="stat-value text-xl">
                    {mockRegistrationSummary.maxCredits - (mockRegistrationSummary.minCredits + 4)}
                  </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-medium text-foreground">Tiến độ CTĐT</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Học phần bắt buộc: 30/42 môn</li>
                <li>• Học phần tự chọn: 12/18 tín chỉ</li>
                <li>• Trạng thái: Đủ điều kiện đăng ký ĐATN từ HK kế tiếp</li>
              </ul>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-medium text-foreground">Lịch sử gần đây</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>10:12 – Đăng ký "CTDLGT202-01" • Thành công</li>
                <li>10:05 – Hủy đăng ký "TA cơ bản 3" • Thành công</li>
                <li>09:58 – Thất bại "CSDL204-02" • Lớp đã đầy</li>
              </ul>
            </div>
            <div className="rounded-xl border border-dashed p-3 text-xs">
              <p className="font-semibold text-foreground">Quy tắc đợt ĐKHP</p>
              <p className="text-muted-foreground">
                Min {mockRegistrationSummary.minCredits} TC • Max {mockRegistrationSummary.maxCredits} TC • Deadline{" "}
                {mockRegistrationSummary.deadline}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(blockingClass)} onOpenChange={(open) => !open && setBlockingClass(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Không thể đăng ký {blockingClass?.code}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">{blockingClass?.name}</p>
            <p className="text-muted-foreground">{blockingMessage}</p>
            {blockingClass?.note ? (
              <p className="text-xs text-primary">Chi tiết: {blockingClass.note}</p>
            ) : null}
            <Badge variant="outline" className="w-fit">
              Liên hệ cố vấn học tập nếu cần hỗ trợ override.
            </Badge>
          </div>
          <Button onClick={() => setBlockingClass(null)} className="mt-4 self-end">
            Đã hiểu
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StudentRegistration;
