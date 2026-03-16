import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLoader } from "@/components/AppLoading";

export default function UserRoleCard({
  userList,
  selectedUserId,
  onSelectUser,
  selectedUser,
  isFetchingUsers,
  selectedUserRoleName,
  setSelectedUserRoleName,
  roleList,
  onSubmit,
  isSavingUserRole,
  userRoleDirty,
}) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">4) Gán role cho user</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={selectedUserId}
          onChange={(e) => onSelectUser(e.target.value)}
        >
          <option value="">Chọn user</option>
          {userList.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>

        {selectedUser && (
          <>
            {isFetchingUsers && (
              <SectionLoader label="Đang cập nhật thông tin user..." className="mb-2" />
            )}
            <p className="text-sm text-muted-foreground">
              User: {selectedUser.username} - Unit: {selectedUser.unit?.name || "-"}
            </p>
            <p className="text-sm text-muted-foreground">
              Quân nhân:{" "}
              {selectedUser.military
                ? `${selectedUser.military.fullname} (${selectedUser.military.militaryCode})`
                : "Chưa claim quân nhân"}
            </p>

            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedUserRoleName}
              onChange={(e) => setSelectedUserRoleName(e.target.value)}
            >
              <option value="">Chọn role</option>
              {roleList
                .filter((role) => role.name !== "SUPER_ADMIN")
                .map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
            </select>

            <Button type="submit" disabled={isSavingUserRole || !userRoleDirty}>
              {isSavingUserRole ? "Đang lưu..." : "Lưu role user"}
            </Button>
          </>
        )}
      </form>
    </Card>
  );
}

