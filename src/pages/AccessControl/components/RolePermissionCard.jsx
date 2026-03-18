import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLoader } from "@/components/AppLoading";

export default function RolePermissionCard({
  roleList,
  selectedRoleId,
  onSelectRole,
  selectedRole,
  isFetchingPermissions,
  permissionKeyword,
  setPermissionKeyword,
  permissionModule,
  setPermissionModule,
  moduleOptions,
  filteredPermissionList,
  selectedPermissionCodes,
  rolePermissionDirty,
  onSelectAllVisiblePermissions,
  onClearAllVisiblePermissions,
  onTogglePermissionCode,
  onSubmit,
  isSavingRolePermissions,
}) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">3) Phân quyền cho role</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={selectedRoleId}
          onChange={(e) => onSelectRole(e.target.value)}
        >
          <option value="">Chọn role</option>
          {roleList.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.userCount} users)
            </option>
          ))}
        </select>

        {selectedRole && (
          <>
            {isFetchingPermissions && (
              <SectionLoader label="Đang cập nhật danh sách quyền..." className="mb-2" />
            )}
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                placeholder="Tìm quyền theo code hoặc mô tả"
                value={permissionKeyword}
                onChange={(e) => setPermissionKeyword(e.target.value)}
              />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={permissionModule}
                onChange={(e) => setPermissionModule(e.target.value)}
              >
                {moduleOptions.map((module) => (
                  <option key={module} value={module}>
                    {module === "ALL" ? "Tất cả module" : module}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Đang hiển thị {filteredPermissionList.length} quyền</span>
              <span>|</span>
              <span>Đã chọn {selectedPermissionCodes.length} quyền</span>
              <span>|</span>
              <span>{rolePermissionDirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}</span>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Button
                type="button"
                className="w-full sm:w-auto"
                variant="outline"
                onClick={onSelectAllVisiblePermissions}
                disabled={filteredPermissionList.length === 0}
              >
                Chọn tất cả đang hiển thị
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                variant="outline"
                onClick={onClearAllVisiblePermissions}
                disabled={filteredPermissionList.length === 0}
              >
                Bỏ chọn đang hiển thị
              </Button>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
              {filteredPermissionList.length === 0 ? (
                <p className="rounded border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  Không có permission phù hợp bộ lọc hiện tại.
                </p>
              ) : (
                filteredPermissionList.map((permission) => {
                  const checked = selectedPermissionCodes.includes(permission.code);
                  return (
                    <label key={permission.id} className="block rounded border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onTogglePermissionCode(permission.code)}
                        />
                        <span className="font-medium">{permission.code}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {permission.description || "Chưa có mô tả"}
                      </p>
                    </label>
                  );
                })
              )}
            </div>

            <Button
              className="w-full sm:w-auto"
              type="submit"
              disabled={isSavingRolePermissions || !rolePermissionDirty}
            >
              {isSavingRolePermissions ? "Đang lưu..." : "Lưu phân quyền role"}
            </Button>
          </>
        )}
      </form>
    </Card>
  );
}
