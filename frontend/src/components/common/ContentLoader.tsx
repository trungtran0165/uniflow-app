type Props = {
  title?: string;
  subtitle?: string;
  size?: "page" | "card";
};

export default function ContentLoader({
  title = "Đang tải…",
  subtitle = "Vui lòng đợi trong giây lát",
  size = "page",
}: Props) {
  const wrapperClass =
    size === "card"
      ? "flex min-h-[240px] w-full items-center justify-center px-4 py-8"
      : "flex min-h-[60vh] w-full items-center justify-center px-4 py-10";

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src="/uit_logo.png"
          alt="UIT"
          className="h-20 w-auto object-contain opacity-90"
          loading="eager"
          decoding="async"
        />
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}


