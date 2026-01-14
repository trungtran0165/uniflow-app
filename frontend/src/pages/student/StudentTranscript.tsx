import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import TranscriptTermAccordion from "@/components/student/TranscriptTermAccordion";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { studentsAPI, authAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import ContentLoader from "@/components/common/ContentLoader";

const StudentTranscript = () => {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState<string | null>(null);

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

  // Fetch transcript data
  const { data: transcriptData, isLoading } = useQuery({
    queryKey: ["student-transcript", studentId],
    queryFn: () => studentsAPI.getTranscript(studentId!),
    enabled: !!studentId,
  });

  // Fetch transcript summary
  const { data: summaryData } = useQuery({
    queryKey: ["student-transcript-summary", studentId],
    queryFn: () => studentsAPI.getTranscriptSummary(studentId!),
    enabled: !!studentId,
  });

  const handleExport = async () => {
    if (!studentId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin sinh viên",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call API to export transcript
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students/${studentId}/transcript/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể xuất bảng điểm');
      }

      // Get blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bang-diem-${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: "Đã tải bảng điểm PDF",
      });
    } catch (error: any) {
      // Fallback: Show toast if API not available
      toast({
        title: "Thông báo",
        description: error.message || "Chức năng xuất PDF đang được phát triển. Vui lòng thử lại sau.",
      });
    }
  };

  if (isLoading || !studentId) {
    return <ContentLoader title="Đang tải dữ liệu…" subtitle="Đang lấy bảng điểm" />;
  }

  const transcriptSummary = summaryData || {
    cumulativeGpa4: transcriptData?.cumulativeGpa || transcriptData?.cumulativeGpa4 || 0,
    cumulativeCredits: transcriptData?.cumulativeCredits || 0,
    ranking: transcriptData?.ranking || "N/A",
    blocked: false,
  };

  // Ensure cumulativeGpa4 is a number
  const gpaValue = typeof transcriptSummary.cumulativeGpa4 === 'number' 
    ? transcriptSummary.cumulativeGpa4 
    : (typeof summaryData?.cumulativeGpa4 === 'number' 
        ? summaryData.cumulativeGpa4 
        : 0);

  const transcriptTerms = transcriptData?.terms || [];

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
          <FileText className="h-4 w-4" /> Xuất bảng điểm PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel interactive-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA tích lũy (4.0)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="stat-value">{gpaValue.toFixed(2)}</p>
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
          {transcriptTerms.length === 0 ? (
            <p className="text-muted-foreground">Chưa có dữ liệu bảng điểm</p>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {transcriptTerms.map((term: any) => (
                <TranscriptTermAccordion
                  key={term.id || term._id || term.semesterId?._id}
                  term={{
                    id: term.id || term._id || term.semesterId?._id,
                    label: term.semester?.name || term.semesterId?.name || "Học kỳ",
                    gpa: term.gpa || 0,
                    credits: term.credits || 0,
                    courses: term.courses?.map((course: any) => ({
                      code: course.code || course.courseCode,
                      name: course.name || course.courseName,
                      credits: course.credits || 0,
                      grade: course.grade || course.letterGrade || "N/A",
                      score: course.score || course.finalGrade || 0,
                    })) || [],
                  }}
                  value={term.id || term._id || term.semesterId?._id}
                />
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default StudentTranscript;
