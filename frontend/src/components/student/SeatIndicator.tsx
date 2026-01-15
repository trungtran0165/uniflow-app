import { cn } from "@/lib/utils";
import { OpenClassStatus } from "@/mocks/student";

const statusMeta: Record<OpenClassStatus, { label: string; dot: string }> = {
  available: { label: "Còn chỗ", dot: "bg-emerald-500" },
  full: { label: "Đã đầy", dot: "bg-destructive" },
  conflict: { label: "Trùng lịch", dot: "bg-accent" },
  "credit-limit": { label: "Vượt tín chỉ", dot: "bg-amber-500" },
  prerequisite: { label: "Thiếu tiên quyết", dot: "bg-blue-500" },
};

interface SeatIndicatorProps {
  enrolled: number;
  capacity: number;
  status: OpenClassStatus;
}

const SeatIndicator = ({ enrolled, capacity, status }: SeatIndicatorProps) => {
  const meta = statusMeta[status];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs">
        <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} aria-hidden />
        <span className="font-semibold text-foreground">
          {enrolled}/{capacity}
        </span>
      </div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{meta.label}</p>
    </div>
  );
};

export default SeatIndicator;

