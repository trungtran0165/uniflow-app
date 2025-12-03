import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";

const rows = [
  { id: 1, studentId: "20520301", name: "Nguyễn Văn A", mid: "8.0", final: "?" },
  { id: 2, studentId: "20520302", name: "Trần Thị B", mid: "7.5", final: "?" },
  { id: 3, studentId: "20520303", name: "Lê Văn C", mid: "9.0", final: "?" },
];

const LecturerGrading = () => {
  return (
    <section aria-labelledby="lecturer-grading-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="lecturer-grading-heading" className="text-xl font-semibold md:text-2xl">
            Nhập điểm lớp CTDLGT202-01
          </h1>
          <p className="text-sm text-muted-foreground">
            Mô phỏng lưới nhập điểm (giống Excel) cho use case "Nhập điểm".
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs md:text-sm">
          <FileText className="h-4 w-4" />
          Tải template Excel (demo)
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lưới nhập điểm</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <table className="min-w-full border text-xs md:text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="border px-2 py-1 text-left font-medium">STT</th>
                <th className="border px-2 py-1 text-left font-medium">MSSV</th>
                <th className="border px-2 py-1 text-left font-medium">Họ tên</th>
                <th className="border px-2 py-1 text-center font-medium">Điểm QT (30%)</th>
                <th className="border px-2 py-1 text-center font-medium">Điểm CK (70%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="odd:bg-background even:bg-muted/40">
                  <td className="border px-2 py-1 text-center">{index + 1}</td>
                  <td className="border px-2 py-1 font-medium">{row.studentId}</td>
                  <td className="border px-2 py-1">{row.name}</td>
                  <td className="border px-2 py-1 text-center">
                    <Input defaultValue={row.mid} className="h-8 w-20 text-center text-xs" />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Input defaultValue={row.final} className="h-8 w-20 text-center text-xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
};

export default LecturerGrading;
