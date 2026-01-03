import "react-quill/dist/quill.bubble.css";

import DOMPurify from "dompurify";
import ReactQuill from "react-quill";

import { cn } from "@/lib/utils";

type Props = {
  html: string;
  className?: string;
};

const sanitized = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // allow embedded images via data URL (frontend-only config)
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // keep Quill formatting (classes/safe inline styles) so preview matches editor
    ADD_ATTR: ["class", "style"],
  });

export const CurriculumHtmlViewer = ({ html, className }: Props) => {
  return (
    <div className={cn("ctdt-viewer", className)}>
      <ReactQuill value={sanitized(html)} readOnly theme="bubble" modules={{ toolbar: false }} />
    </div>
  );
};


