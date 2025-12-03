import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp } from "lucide-react";

const termResults = [
  {
    term: "HK1 2025–2026",
    gpa10: 8.1,
    gpa4: 3.42,
    credits: 18,
    courses: [
      { code: "CTDLGT202", name: "Cấu trúc dữ liệu & Giải thuật", grade: "A", credits: 3 },
      { code: "CSDL204", name: "Cơ sở dữ liệu", grade: "B+", credits: 3 },
      { code: "KTTC101", name: "Kinh tế chính trị", grade: "A-", credits: 2 },
    ],
  },
  {
    term: "HK2 2024–2025",
    gpa10: 7.8,
    gpa4: 3.25,
    credits: 20,
    courses: [
      { code: "LAPTRINH1", name: "Lập trình cơ bản", grade: "A", credits: 3 },
      { code: "TOANC1", name: "Toán cao cấp 1", grade: "B", credits: 3 },
    ],
  },
];

const StudentTranscript = () => {
  const cumulativeGpa4 = 3.36;
  const cumulativeCredits = 96;

  return (
    <section aria-labelledby="student-transcript-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="student-transcript-heading" className="text-xl font-semibold md:text-2xl">
            Kết quả học tập
          </h1>
          <p className="text-sm text-muted-foreground">
            Mô phỏng màn hình "Kết quả học tập" với GPA kỳ, GPA tích lũy và bảng điểm theo học kỳ.
          </p>
        </div>
        <button
          type="button"
          className="schedule-slot text-xs font-medium hover:bg-primary hover:text-primary-foreground"
        >
          <FileText className="mr-2 h-4 w-4" /> Xuất bảng điểm PDF (demo)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA tích lũy (4.0)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">{cumulativeGpa4.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Cập nhật đến hết HK1 2025–2026.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tín chỉ tích lũy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">{cumulativeCredits}</p>
            <p className="text-xs text-muted-foreground">Bao gồm cả học phần bắt buộc và tự chọn.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Xếp loại tạm thời</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">Khá</p>
            <p className="text-xs text-muted-foreground">Đủ điều kiện xét học bổng học kỳ tiếp theo.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bảng điểm theo học kỳ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {termResults.map((term) => (
            <div key={term.term} className="space-y-2 rounded-xl bg-secondary/60 p-3">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <p className="font-semibold text-foreground">{term.term}</p>
                  <p className="text-xs text-muted-foreground">
                    GPA: {term.gpa10.toFixed(1)} / 10 • {term.gpa4.toFixed(2)} / 4.0
                  </p>
                </div>
                <div className="pill-badge text-xs">
                  {term.credits} tín chỉ đã tích lũy trong kỳ
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-4 text-left font-medium">Mã HP</th>
                      <th className="py-1 pr-4 text-left font-medium">Tên học phần</th>
                      <th className="py-1 pr-4 text-left font-medium">Số TC</th>
                      <th className="py-1 text-left font-medium">Điểm chữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {term.courses.map((course) => (
                      <tr key={course.code} className="border-b last:border-b-0">
                        <td className="py-1.5 pr-4 font-medium text-foreground">{course.code}</td>
                        <td className="py-1.5 pr-4">{course.name}</td>
                        <td className="py-1.5 pr-4 text-center">{course.credits}</td>
                        <td className="py-1.5 text-left font-semibold">{course.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};

export default StudentTranscript;
