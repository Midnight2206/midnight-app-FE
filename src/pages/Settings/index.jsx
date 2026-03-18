import { MonitorCog, MoonStar, SunMedium } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card className="surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <MonitorCog className="h-3.5 w-3.5" />
              Cài đặt giao diện
            </div>
            <h1 className="mt-3 text-lg font-semibold">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tuỳ chỉnh giao diện hiển thị của ứng dụng trên thiết bị hiện tại.
            </p>
          </div>
          <div className="w-fit rounded-2xl border border-border/70 bg-background/70 p-3">
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
                Chuyển nhanh giữa giao diện sáng và tối. Thiết lập này được lưu trên trình duyệt.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto">
              <span className="text-xs text-muted-foreground">Light</span>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
              <span className="text-xs text-muted-foreground">Dark</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              className="w-full sm:w-auto"
              variant={isDark ? "default" : "outline"}
              onClick={toggleTheme}
            >
              {isDark ? "Đang dùng giao diện tối" : "Chuyển sang giao diện tối"}
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              variant="ghost"
              onClick={toggleTheme}
            >
              {isDark ? "Chuyển về giao diện sáng" : "Giữ giao diện sáng"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
