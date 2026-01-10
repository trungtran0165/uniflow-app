import { cn } from "@/lib/utils";

type TimetableStatus = "normal" | "changed" | "cancelled";

interface TimetableCellProps {
  course: string;
  time: string;
  room: string;
  status?: TimetableStatus;
  note?: string;
}

const statusClass: Record<TimetableStatus, string> = {
  normal: "border-border",
  changed: "border-amber-500/70 bg-amber-500/5",
  cancelled: "border-destructive/70 bg-destructive/5 opacity-80",
};

const TimetableCell = ({ course, time, room, status = "normal", note }: TimetableCellProps) => {
  return (
    <div className={cn("schedule-slot text-left", statusClass[status])}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{time}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{course}</p>
      <p className="text-xs text-muted-foreground">Phòng {room}</p>
      {note ? <p className="mt-1 text-[11px] text-foreground">{note}</p> : null}
    </div>
  );
};

export default TimetableCell;

