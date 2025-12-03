import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpenCheck, Plus } from "lucide-react";

const programs = [
  { code: "7480201", name: "Công nghệ thông tin", version: "2023", majors: 3 },
  { code: "7340101", name: "Quản trị kinh doanh", version: "2022", majors: 2 },
];

const AdminPrograms = () => {
  return (
    <section aria-labelledby="admin-programs-heading" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 id="admin-programs-heading" className="text-xl font-semibold md:text-2xl">
            CTĐT &amp; danh mục học phần
          </h1>
          <p className="text-sm text-muted-foreground">
            Minh hoạ use case quản lý chương trình đào tạo, học phần và điều kiện tiên quyết.
          </p>
        </div>
        <Button size="sm" className="flex items-center gap-2 text-xs md:text-sm">
          <Plus className="h-4 w-4" /> Tạo CTĐT mới
        </Button>
      </div>

      <Card className="glass-panel interactive-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Chương trình đào tạo</CardTitle>
            <p className="text-xs text-muted-foreground">Danh sách theo ngành/khóa, có version CTĐT.</p>
          </div>
          <BookOpenCheck className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {programs.map((program) => (
            <div
              key={program.code}
              className="flex flex-col gap-2 rounded-lg border bg-card/80 px-3 py-2 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {program.code} – {program.name}
                </p>
                <p className="text-xs text-muted-foreground">Version CTĐT: {program.version} • Chuyên ngành: {program.majors}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Button size="sm" variant="outline">
                  Danh mục học phần
                </Button>
                <Button size="sm" variant="ghost">
                  Điều kiện tiên quyết
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};

export default AdminPrograms;
