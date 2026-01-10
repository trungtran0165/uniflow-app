import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpenCheck, FileText, Layers3, GraduationCap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { CurriculumSystem } from "@/data/curriculumPrograms";
import {
  findProgram,
  listCohorts,
  listMajors,
  loadCurriculumPrograms,
} from "@/lib/curriculumStore";
import { Badge } from "@/components/ui/badge";
import { CurriculumHtmlViewer } from "@/components/CurriculumHtmlViewer";

const StudentCurriculum = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [programs] = useState(() => loadCurriculumPrograms());

  const systemParam = (searchParams.get("system") as CurriculumSystem | null) ?? null;
  const cohortParam = searchParams.get("cohort");
  const majorParam = searchParams.get("major");

  const [system, setSystem] = useState<CurriculumSystem | "">(
    systemParam === "chinh-quy" || systemParam === "tu-xa" ? systemParam : "",
  );
  const [cohort, setCohort] = useState<string>(cohortParam ?? "");
  const [major, setMajor] = useState<string>(majorParam ?? "");

  // keep internal state synced if user lands via deep-link
  useEffect(() => {
    if (systemParam && (systemParam === "chinh-quy" || systemParam === "tu-xa")) setSystem(systemParam);
    if (cohortParam !== null) setCohort(cohortParam);
    if (majorParam !== null) setMajor(majorParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemParam, cohortParam, majorParam]);

  const cohorts = useMemo(() => listCohorts(programs, system || undefined), [programs, system]);
  const majors = useMemo(() => listMajors(programs, system || undefined, cohort || undefined), [programs, system, cohort]);

  const selectedProgram = useMemo(
    () => findProgram(programs, system || undefined, cohort || undefined, major || undefined),
    [programs, system, cohort, major],
  );

  const selectedHtml = selectedProgram?.html ?? "";

  const updateParams = (next: { system?: string; cohort?: string; major?: string }) => {
    const params = new URLSearchParams(searchParams);
    if (next.system !== undefined) {
      next.system ? params.set("system", next.system) : params.delete("system");
    }
    if (next.cohort !== undefined) {
      next.cohort ? params.set("cohort", next.cohort) : params.delete("cohort");
    }
    if (next.major !== undefined) {
      next.major ? params.set("major", next.major) : params.delete("major");
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <section aria-labelledby="student-curriculum-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="student-curriculum-heading" className="text-xl font-semibold md:text-2xl">
            Tra cứu Chương trình đào tạo
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn hệ đào tạo, khóa CTĐT và ngành để xem nội dung CTĐT. Nội dung được Phòng đào tạo cấu hình.
          </p>
        </div>
        {selectedProgram ? (
          <div className="pill-badge flex items-center gap-2">
            <BookOpenCheck className="h-3.5 w-3.5" />
            {selectedProgram.majorLabel} · Khóa {selectedProgram.cohort}
          </div>
        ) : null}
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bộ lọc CTĐT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <p className="stat-label">Step 1 · Hệ đào tạo</p>
              <Select
                value={system}
                onValueChange={(value: CurriculumSystem) => {
                  setSystem(value);
                  setCohort("");
                  setMajor("");
                  updateParams({ system: value, cohort: "", major: "" });
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn hệ đào tạo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chinh-quy">Hệ chính quy</SelectItem>
                  <SelectItem value="tu-xa">Hệ từ xa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="stat-label">Step 2 · Khóa CTĐT</p>
              <Select
                value={cohort}
                onValueChange={(value) => {
                  setCohort(value);
                  setMajor("");
                  updateParams({ cohort: value, major: "" });
                }}
                disabled={!system}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={system ? "Chọn khóa CTĐT" : "Chọn Step 1 trước"} />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c) => (
                    <SelectItem key={c} value={c}>
                      CTĐT Khóa {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="stat-label">Step 3 · Ngành</p>
              <Select
                value={major}
                onValueChange={(value) => {
                  setMajor(value);
                  updateParams({ major: value });
                }}
                disabled={!system || !cohort}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={system && cohort ? "Chọn ngành" : "Chọn Step 1–2 trước"} />
                </SelectTrigger>
                <SelectContent>
                  {majors.map((m) => (
                    <SelectItem key={m.major} value={m.major}>
                      {m.majorLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Gợi ý</p>
            <p>Link trang sẽ tự cập nhật theo lựa chọn để bạn copy/share cho bạn bè.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Nội dung CTĐT</CardTitle>
            <p className="text-xs text-muted-foreground">Step 4 · Hiển thị nội dung theo cấu hình của Phòng đào tạo.</p>
          </div>
          <Badge variant="outline" className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" />
            HTML
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {!system || !cohort || !major ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Layers3 className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Chọn đủ 3 bước để xem CTĐT</p>
              <p className="mt-1 text-xs">Bắt đầu từ hệ đào tạo → khóa → ngành.</p>
            </div>
          ) : !selectedProgram ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Chưa có nội dung CTĐT cho lựa chọn này</p>
              <p className="mt-1 text-xs">PĐT sẽ cập nhật nội dung trong thời gian tới.</p>
            </div>
          ) : (
            <CurriculumHtmlViewer html={selectedHtml} />
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default StudentCurriculum;

