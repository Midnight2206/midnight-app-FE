import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function InlineLoader({
  label = "Đang tải...",
  className,
  iconClassName,
  textClassName,
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className={cn("h-4 w-4 animate-spin", iconClassName)} />
      <span className={cn("text-sm", textClassName)}>{label}</span>
    </span>
  );
}

export function LoadingButtonLabel({
  loading,
  loadingText = "Đang xử lý...",
  defaultText,
}) {
  if (!loading) return defaultText;
  return <InlineLoader label={loadingText} textClassName="font-medium" />;
}

export function PageLoader({
  title = "Đang tải dữ liệu...",
  description = "Vui lòng chờ trong giây lát.",
  className,
}) {
  return (
    <div className={cn("flex min-h-[60vh] items-center justify-center p-6", className)}>
      <Card className="surface w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

export function SectionLoader({
  label = "Đang tải dữ liệu...",
  className,
  textClassName = "text-muted-foreground",
}) {
  return (
    <Card className={cn("surface p-5", className)}>
      <InlineLoader label={label} textClassName={textClassName} />
    </Card>
  );
}

export function OverlayLoader({
  show,
  label = "Đang cập nhật...",
  className,
}) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center bg-background/55 backdrop-blur-[1.5px]",
        className,
      )}
    >
      <Card className="surface px-4 py-2">
        <InlineLoader label={label} textClassName="text-muted-foreground" />
      </Card>
    </div>
  );
}
