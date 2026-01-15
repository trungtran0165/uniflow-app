import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TranscriptTermAccordionProps {
  term: {
    id: string;
    label: string;
    gpa: number;
    credits: number;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
      grade: string;
      score: number;
      midtermScore?: number;
      finalScore?: number;
    }>;
  };
  value: string;
}

const TranscriptTermAccordion = ({ term, value }: TranscriptTermAccordionProps) => {
  const gpa10 = term.gpa || 0;
  const gpa4 = gpa10 * 0.4; // Convert 10-scale to 4-scale

  return (
    <AccordionItem value={value} className="rounded-xl border bg-secondary/40 px-3">
      <AccordionTrigger className="py-3 text-left">
        <div className="flex flex-col gap-1 text-left">
          <p className="text-sm font-semibold text-foreground">{term.label}</p>
          <p className="text-xs text-muted-foreground">
            GPA {gpa10.toFixed(2)} / 10 • {gpa4.toFixed(2)} / 4.0 • {term.credits} tín chỉ
          </p>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="overflow-x-auto pb-2">
          <table className="min-w-full text-xs">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-1.5 pr-4 text-left font-medium">Mã HP</th>
                <th className="py-1.5 pr-4 text-left font-medium">Tên học phần</th>
                <th className="py-1.5 pr-4 text-center font-medium">TC</th>
                <th className="py-1.5 pr-4 text-center font-medium">Quá trình</th>
                <th className="py-1.5 pr-4 text-center font-medium">Cuối kỳ</th>
                <th className="py-1.5 pr-4 text-center font-medium">Điểm TB</th>
                <th className="py-1.5 text-left font-medium">Điểm chữ</th>
              </tr>
            </thead>
            <tbody>
              {term.courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted-foreground">
                    Chưa có điểm
                  </td>
                </tr>
              ) : (
                term.courses.map((course) => (
                  <tr key={`${term.id}-${course.code}`} className="border-b last:border-b-0">
                    <td className="py-1.5 pr-4 font-semibold text-foreground">{course.code}</td>
                    <td className="py-1.5 pr-4">{course.name}</td>
                    <td className="py-1.5 pr-4 text-center">{course.credits}</td>
                    <td className="py-1.5 pr-4 text-center">
                      {course.midtermScore !== undefined && course.midtermScore !== null 
                        ? course.midtermScore.toFixed(1) 
                        : "-"}
                    </td>
                    <td className="py-1.5 pr-4 text-center">
                      {course.finalScore !== undefined && course.finalScore !== null 
                        ? course.finalScore.toFixed(1) 
                        : "-"}
                    </td>
                    <td className="py-1.5 pr-4 text-center font-semibold text-primary">
                      {course.score > 0 ? course.score.toFixed(2) : "-"}
                    </td>
                    <td className="py-1.5 font-semibold">{course.grade || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TranscriptTermAccordion;

