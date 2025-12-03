import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { curriculumSemesters, CurriculumCourse } from "@/mocks/student";
import CourseStatusBadge from "@/components/student/CourseStatusBadge";
import { BookOpenCheck, Search } from "lucide-react";

const filterCourses = (courses: CurriculumCourse[], keyword: string, type: string) => {
  const term = keyword.toLowerCase();
  return courses.filter((course) => {
    const matchesKeyword =
      !term || course.name.toLowerCase().includes(term) || course.code.toLowerCase().includes(term);
    const matchesType = type === "all" || course.type === type;
    return matchesKeyword && matchesType;
  });
};

const StudentCurriculum = () => {
  const [activeSemester, setActiveSemester] = useState(curriculumSemesters[0]?.id ?? "");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Bắt buộc" | "Tự chọn">("all");

  const selectedSemester = useMemo(
    () => curriculumSemesters.find((semester) => semester.id === activeSemester) ?? curriculumSemesters[0],
    [activeSemester],
  );

  const filteredCourses = useMemo(
    () => filterCourses(selectedSemester?.courses ?? [], keyword, typeFilter),
    [selectedSemester?.courses, keyword, typeFilter],
  );

  const totals = useMemo(() => {
    const courses = selectedSemester?.courses ?? [];
    return {
      completed: courses.filter((course) => course.status === "completed").length,
      inProgress: courses.filter((course) => course.status === "in-progress").length,
      pending: courses.filter((course) => course.status === "pending").length,
    };
  }, [selectedSemester?.courses]);

  return (
    <section aria-labelledby="student-curriculum-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="student-curriculum-heading" className="text-xl font-semibold md:text-2xl">
            Tra cứu Chương trình đào tạo
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách học phần được nhóm theo học kỳ đề xuất, có trạng thái Đã học/Đang học/Chưa học.
          </p>
        </div>
        <div className="pill-badge flex items-center gap-2">
          <BookOpenCheck className="h-3.5 w-3.5" />
          Khoa Công nghệ thông tin · Khóa 2022
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.2fr)]">
        <Card className="glass-panel interactive-card">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Lộ trình học phần</CardTitle>
              <p className="text-xs text-muted-foreground">Click từng học kỳ để xem chi tiết.</p>
            </div>
            <Tabs value={activeSemester} onValueChange={setActiveSemester}>
              <TabsList className="flex flex-wrap gap-2 bg-transparent">
                {curriculumSemesters.map((semester) => (
                  <TabsTrigger key={semester.id} value={semester.id} className="rounded-full bg-muted px-3 text-xs">
                    {semester.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {curriculumSemesters.map((semester) => (
                <TabsContent key={semester.id} value={semester.id} className="space-y-3 pt-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
                    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Tìm mã môn / tên môn"
                        className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                      />
                    </div>

                    <Select value={typeFilter} onValueChange={(value: typeof typeFilter) => setTypeFilter(value)}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Loại học phần" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả loại</SelectItem>
                        <SelectItem value="Bắt buộc">Bắt buộc</SelectItem>
                        <SelectItem value="Tự chọn">Tự chọn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    {filteredCourses.length === 0 ? (
                      <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                        Không tìm thấy học phần phù hợp với tiêu chí lọc. Vui lòng thử lại.
                      </div>
                    ) : (
                      filteredCourses.map((course) => (
                        <div key={course.code} className="rounded-xl border bg-card/80 p-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{course.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {course.code} • {course.credits} tín chỉ • {course.type}
                              </p>
                            </div>
                            <CourseStatusBadge status={course.status} />
                          </div>
                          {course.prerequisites?.length ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Tiên quyết: {course.prerequisites.join(", ")}
                            </p>
                          ) : null}
                          {course.description ? (
                            <p className="mt-1 text-xs text-muted-foreground">{course.description}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardHeader>
        </Card>

        <Card className="glass-panel interactive-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tổng quan học kỳ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="stat-label">Ghi chú học kỳ</p>
              <p className="text-sm text-foreground">{selectedSemester?.note ?? "Tiếp tục tích lũy tín chỉ chuyên ngành."}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border bg-card/70 p-3">
                <p className="stat-label">Đã học</p>
                <p className="stat-value text-xl">{totals.completed}</p>
              </div>
              <div className="rounded-lg border bg-card/70 p-3">
                <p className="stat-label">Đang học</p>
                <p className="stat-value text-xl">{totals.inProgress}</p>
              </div>
              <div className="rounded-lg border bg-card/70 p-3">
                <p className="stat-label">Chưa học</p>
                <p className="stat-value text-xl">{totals.pending}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-semibold text-foreground">Chú giải trạng thái</p>
              <div className="flex flex-wrap gap-2">
                <CourseStatusBadge status="completed" />
                <CourseStatusBadge status="in-progress" />
                <CourseStatusBadge status="pending" />
              </div>
              <p className="text-muted-foreground">
                Các trạng thái được tính dựa trên lịch sử học tập và các lớp đã đăng ký trong kỳ hiện tại.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StudentCurriculum;

