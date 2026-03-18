import { useSelector } from "react-redux";
import { MonitorCog, MoonStar, SunMedium, UserRound } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import DashboardPageShell from "@/layouts/components/DashboardPageShell";
import { useTheme } from "@/hooks/useTheme";

function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return date.toLocaleString("vi-VN");
}

function formatRoles(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.length === 0) return "USER";
  return roles.join(", ");
}

export default function DashboardSettingsPage() {
  const user = useSelector((state) => state.auth.user);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <DashboardPageShell
      title="Cài đặt & hồ sơ"
      description="Tùy chỉnh giao diện làm việc và xem thông tin tài khoản hiện tại."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <Card className="surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                <MonitorCog className="h-3.5 w-3.5" />
                Tùy chọn giao diện
              </div>
              <h2 className="mt-3 text-lg font-semibold">Giao diện sáng / tối</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theme được lưu ngay trên trình duyệt của bạn để dùng lại ở các lần đăng nhập sau.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              {isDark ? (
                <MoonStar className="h-5 w-5 text-primary" />
              ) : (
                <SunMedium className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">
                  Chế độ hiện tại: {isDark ? "Dark mode" : "Light mode"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bật để chuyển sang giao diện tối, tắt để quay về giao diện sáng.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Light</span>
                <Switch checked={isDark} onCheckedChange={toggleTheme} />
                <span className="text-xs text-muted-foreground">Dark</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant={isDark ? "default" : "outline"} onClick={toggleTheme}>
                {isDark ? "Đang dùng giao diện tối" : "Chuyển sang giao diện tối"}
              </Button>
              <Button type="button" variant="ghost" onClick={toggleTheme}>
                {isDark ? "Chuyển về giao diện sáng" : "Giữ giao diện sáng"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" />
                Hồ sơ đăng nhập
              </div>
              <h2 className="mt-3 text-lg font-semibold">Thông tin tài khoản</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dữ liệu đang được lấy từ phiên đăng nhập hiện tại.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Username</p>
              <p className="mt-1 text-sm font-medium">{user?.username || "-"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
              <p className="mt-1 text-sm font-medium">{user?.email || "-"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Vai trò</p>
              <p className="mt-1 text-sm font-medium">{formatRoles(user)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Đơn vị</p>
              <p className="mt-1 text-sm font-medium">{user?.unit?.name || "Chưa gán đơn vị"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Xác minh email</p>
              <p className="mt-1 text-sm font-medium">
                {user?.verifiedAt ? `Đã xác minh lúc ${formatDateTime(user.verifiedAt)}` : "Chưa xác minh"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardPageShell>
  );
}
