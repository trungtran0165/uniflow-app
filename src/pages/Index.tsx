import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, Users } from "lucide-react";

const Index = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "UniReg - Hệ thống quản lý sinh viên & đăng ký học phần",
    applicationCategory: "EducationalApplication",
    url: window.location.origin,
    description:
      "Cổng thông tin dành cho sinh viên, giảng viên và phòng đào tạo để quản lý chương trình đào tạo, đăng ký học phần và theo dõi kết quả học tập.",
    inLanguage: "vi-VN",
    operatingSystem: "Any",
  } as const;

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 md:grid md:grid-cols-[1.4fr_1fr] md:items-center">
        <div className="space-y-6">
          <div className="pill-badge">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Hệ thống thông tin đào tạo thế hệ mới
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              UniReg – Cổng quản lý sinh viên &amp; đăng ký học phần
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Thiết kế riêng cho trường đại học Việt Nam, hỗ trợ sinh viên đăng ký học phần, giảng viên nhập điểm và
              phòng đào tạo điều phối toàn bộ kỳ học trên một màn hình tổng quan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/student">Vào portal Sinh viên</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/lecturer">Vào portal Giảng viên</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/admin">Vào portal PĐT/Admin</Link>
            </Button>
          </div>

          <dl className="grid max-w-xl grid-cols-2 gap-4 text-xs text-muted-foreground sm:grid-cols-3">
            <div>
              <dt className="stat-label">3 tác nhân chính</dt>
              <dd className="mt-1 font-semibold text-foreground">SV · GV · PĐT</dd>
            </div>
            <div>
              <dt className="stat-label">Tập trung quy trình</dt>
              <dd className="mt-1 font-semibold text-foreground">Đăng ký → Học → Điểm</dd>
            </div>
            <div>
              <dt className="stat-label">Giao diện dashboard</dt>
              <dd className="mt-1 font-semibold text-foreground">Hiện đại, trực quan</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <Card className="glass-panel interactive-card">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Sinh viên</CardTitle>
                <CardDescription>Đăng ký học phần, xem lịch, theo dõi điểm.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex justify-between text-xs text-muted-foreground">
              <span>Widget Dashboard · ĐKHP · Thời khóa biểu</span>
              <Link to="/student" className="text-primary underline-offset-2 hover:underline">
                Vào portal
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-panel interactive-card">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Giảng viên</CardTitle>
                <CardDescription>Quản lý lớp phụ trách, cấu hình &amp; nhập điểm.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex justify-between text-xs text-muted-foreground">
              <span>Lịch dạy · Danh sách lớp · Grid nhập điểm</span>
              <Link to="/lecturer" className="text-primary underline-offset-2 hover:underline">
                Vào portal
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-panel interactive-card">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">PĐT / Admin</CardTitle>
                <CardDescription>Cấu hình CTĐT, mở lớp, đợt ĐKHP &amp; báo cáo.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex justify-between text-xs text-muted-foreground">
              <span>Control panel cho toàn bộ học kỳ</span>
              <Link to="/admin" className="text-primary underline-offset-2 hover:underline">
                Vào portal
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </main>
  );
};

export default Index;
