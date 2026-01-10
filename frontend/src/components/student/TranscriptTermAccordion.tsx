import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TranscriptTerm } from "@/mocks/student";

interface TranscriptTermAccordionProps {
  term: TranscriptTerm;
  value: string;
}

const TranscriptTermAccordion = ({ term, value }: TranscriptTermAccordionProps) => {
  return (
    <AccordionItem value={value} className="rounded-xl border bg-secondary/40 px-3">
      <AccordionTrigger className="py-3 text-left">
        <div className="flex flex-col gap-1 text-left">
          <p className="text-sm font-semibold text-foreground">{term.label}</p>
          <p className="text-xs text-muted-foreground">
            GPA {term.gpa10.toFixed(1)} / 10 • {term.gpa4.toFixed(2)} / 4.0 • {term.credits} tín chỉ
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
                <th className="py-1.5 pr-4 text-center font-medium">Thi</th>
                <th className="py-1.5 text-left font-medium">Điểm chữ</th>
              </tr>
            </thead>
            <tbody>
              {term.courses.map((course) => (
                <tr key={`${term.id}-${course.code}`} className="border-b last:border-b-0">
                  <td className="py-1.5 pr-4 font-semibold text-foreground">{course.code}</td>
                  <td className="py-1.5 pr-4">{course.name}</td>
                  <td className="py-1.5 pr-4 text-center">{course.credits}</td>
                  <td className="py-1.5 pr-4 text-center">{course.processScore.toFixed(1)}</td>
                  <td className="py-1.5 pr-4 text-center">{course.finalScore.toFixed(1)}</td>
                  <td className="py-1.5 font-semibold">{course.letter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default TranscriptTermAccordion;

