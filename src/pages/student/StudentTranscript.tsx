import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import TranscriptTermAccordion from "@/components/student/TranscriptTermAccordion";
import { transcriptSummary, transcriptTerms } from "@/mocks/student";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const StudentTranscript = () => {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Đang tải bảng điểm (mock)",
      description: "File PDF giả lập sẽ được tạo trong phiên bản hoàn chỉnh.",
    });
  };

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
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-xs font-medium"
          onClick={handleExport}
        >
          <FileText className="h-4 w-4" /> Xuất bảng điểm PDF (demo)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA tích lũy (4.0)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">{transcriptSummary.cumulativeGpa4.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Cập nhật đến hết HK1 2025–2026.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tín chỉ tích lũy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">{transcriptSummary.cumulativeCredits}</p>
            <p className="text-xs text-muted-foreground">Bao gồm cả học phần bắt buộc và tự chọn.</p>
          </CardContent>
        </Card>

        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Xếp loại tạm thời</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="stat-value">{transcriptSummary.ranking}</p>
            <p className="text-xs text-muted-foreground">Đủ điều kiện xét học bổng học kỳ tiếp theo.</p>
          </CardContent>
        </Card>
      </div>

      {transcriptSummary.blocked ? (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">
            Tài khoản đang bị hạn chế xem điểm do chưa hoàn tất nghĩa vụ tài chính. Liên hệ phòng Công tác SV để được hỗ
            trợ.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="glass-panel interactive-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bảng điểm theo học kỳ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Accordion type="single" collapsible className="space-y-2">
            {transcriptTerms.map((term) => (
              <TranscriptTermAccordion key={term.id} term={term} value={term.id} />
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
};

export default StudentTranscript;
