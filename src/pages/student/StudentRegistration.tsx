import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck, Filter, Info, Search } from "lucide-react";

interface OpenClassRow {
  id: number;
  code: string;
  name: string;
  faculty: string;
  credits: number;
  capacity: number;
  enrolled: number;
  status: "available" | "full" | "conflict";
  time: string;
}

const OPEN_CLASSES: OpenClassRow[] = [
  {
    id: 1,
    code: "CTDLGT202-01",
    name: "Cấu trúc dữ liệu & Giải thuật",
    faculty: "CNTT",
    credits: 3,
    capacity: 80,
    enrolled: 72,
    status: "available",
    time: "T2 (1-3) • B1-103",
  },
  {
    id: 2,
    code: "CSDL204-02",
    name: "Cơ sở dữ liệu",
    faculty: "CNTT",
    credits: 3,
    capacity: 80,
    enrolled: 80,
    status: "full",
    time: "T3 (4-6) • B1-203",
  },
  {
    id: 3,
    code: "HDH205-01",
    name: "Hệ điều hành",
    faculty: "CNTT",
    credits: 3,
    capacity: 60,
    enrolled: 40,
    status: "conflict",
    time: "T2 (1-3) • A2-401 (Trùng CTDL & GT)",
  },
];

const StudentRegistration = () => {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [faculty, setFaculty] = useState("tat-ca");

  const handleRegister = (row: OpenClassRow) => {
    if (row.status === "full") {
      toast({
        title: "Lớp đã đủ sĩ số",
        description: "Vui lòng chọn lớp khác hoặc chuyển sang danh sách chờ.",
        variant: "destructive",
      });
      return;
    }

    if (row.status === "conflict") {
      toast({
        title: "Trùng thời khóa biểu",
        description: "Ca học này trùng với lớp bạn đã đăng ký trong tuần.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Đăng ký thành công",
      description: `${row.code} – ${row.name} đã được thêm vào danh sách lớp của bạn.`,
    });
  };

  const filtered = OPEN_CLASSES.filter((row) => {
    const matchKeyword =
      !keyword ||
      row.code.toLowerCase().includes(keyword.toLowerCase()) ||
      row.name.toLowerCase().includes(keyword.toLowerCase());
    const matchFaculty = faculty === "tat-ca" || row.faculty === faculty;
    return matchKeyword && matchFaculty;
  });

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
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Còn chỗ
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Đầy
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Trùng lịch
                </span>
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
                  <SelectItem value="CNTT">Công nghệ thông tin</SelectItem>
                  <SelectItem value="KinhTe">Kinh tế</SelectItem>
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
                {filtered.map((row) => {
                  const ratio = `${row.enrolled}/${row.capacity}`;
                  const statusDotClass =
                    row.status === "available"
                      ? "bg-emerald-500"
                      : row.status === "full"
                        ? "bg-destructive"
                        : "bg-accent";

                  return (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 align-top font-medium text-foreground">{row.code}</td>
                      <td className="py-2 pr-4 align-top">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{row.name}</p>
                          <p className="text-xs text-muted-foreground">CTĐT chuẩn · Bắt buộc</p>
                        </div>
                      </td>
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{row.faculty}</td>
                      <td className="py-2 pr-4 align-top text-center">{row.credits}</td>
                      <td className="py-2 pr-4 align-top">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
                          <span>{ratio}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{row.time}</td>
                      <td className="py-2 align-top text-right">
                        <Button
                          size="sm"
                          variant={row.status === "available" ? "default" : "outline"}
                          disabled={row.status === "full"}
                          onClick={() => handleRegister(row)}
                        >
                          {row.status === "available" && "Chọn đăng ký"}
                          {row.status === "full" && "Đã đầy"}
                          {row.status === "conflict" && "Trùng lịch"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
                <p className="stat-value text-xl">18</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-2">
                <p className="stat-label">Tín chỉ còn trống</p>
                <p className="stat-value text-xl">6</p>
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StudentRegistration;
