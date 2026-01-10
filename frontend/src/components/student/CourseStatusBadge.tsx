import { ReactNode } from "react";
import { CurriculumCourseStatus } from "@/mocks/student";
import { cn } from "@/lib/utils";

const statusMeta: Record<CurriculumCourseStatus, { label: string; className: string }> = {
  completed: { label: "Đã học", className: "bg-emerald-500/10 text-emerald-600" },
  "in-progress": { label: "Đang học", className: "bg-amber-500/10 text-amber-600" },
  pending: { label: "Chưa học", className: "bg-muted text-muted-foreground" },
};

interface CourseStatusBadgeProps {
  status: CurriculumCourseStatus;
  children?: ReactNode;
}

const CourseStatusBadge = ({ status, children }: CourseStatusBadgeProps) => {
  const meta = statusMeta[status];

  return (
    <span className={cn("pill-badge text-[11px] uppercase tracking-wide", meta.className)}>
      {children ?? meta.label}
    </span>
  );
};

export default CourseStatusBadge;

