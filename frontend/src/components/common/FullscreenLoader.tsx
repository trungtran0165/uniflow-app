type Props = {
  title?: string;
  subtitle?: string;
};

export default function FullscreenLoader({
  title = "Đang tải…",
  subtitle = "Vui lòng đợi trong giây lát",
}: Props) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/uit_logo.png"
            alt="UIT"
            className="h-24 w-auto object-contain"
            loading="eager"
            decoding="async"
          />
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <div className="text-center">
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
}



