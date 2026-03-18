import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccessSyncCard({ onSync, isSyncingPermissions }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">1) Đồng bộ quyền từ Backend Routes</h2>
          <p className="text-sm text-muted-foreground">
            Bỏ qua các quyền hệ thống: đăng nhập, đăng ký, refresh/logout và lấy user hiện tại.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={onSync} disabled={isSyncingPermissions}>
          {isSyncingPermissions ? "Đang đồng bộ..." : "Đồng bộ permissions"}
        </Button>
      </div>
    </Card>
  );
}
