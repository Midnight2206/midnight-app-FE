import { Link, useNavigate } from "react-router-dom";
import { Home, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="surface w-full max-w-lg p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Error</p>
        <h1 className="mt-2 text-7xl font-extrabold leading-none text-primary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Liên kết có thể đã thay đổi hoặc trang không còn tồn tại.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            <Undo2 className="h-4 w-4" />
            Quay lại
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </Card>
    </div>
  );
}
