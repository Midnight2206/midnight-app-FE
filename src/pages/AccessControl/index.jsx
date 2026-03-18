import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { OverlayLoader, PageLoader } from "@/components/AppLoading";
import {
  useCreateAccessRoleMutation,
  useGetAccessPermissionsQuery,
  useGetAccessRolesQuery,
  useGetAccessUsersQuery,
  useSyncAccessPermissionsMutation,
  useUpdateRolePermissionsMutation,
  useUpdateUserRoleMutation,
} from "@/features/access/accessApi";
import { ACCESS_RULES } from "@/features/auth/authorization";
import { useAuthorization } from "@/features/auth/useAuthorization";
import { getApiErrorMessage } from "@/utils/apiError";
import DashboardPageShell from "@/layouts/components/DashboardPageShell";
import AccessSyncCard from "./components/AccessSyncCard";
import CreateRoleCard from "./components/CreateRoleCard";
import RolePermissionCard from "./components/RolePermissionCard";
import UserRoleCard from "./components/UserRoleCard";
import { getPermissionModule, isSameStringArray, normalizeCodes } from "./utils";

export default function AccessControlPage() {
  const { can } = useAuthorization();
  const canAccessControl = can(ACCESS_RULES.accessControlPage);

  const [newRole, setNewRole] = useState({ name: "", description: "" });

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState([]);
  const [initialPermissionCodes, setInitialPermissionCodes] = useState([]);
  const [permissionKeyword, setPermissionKeyword] = useState("");
  const [permissionModule, setPermissionModule] = useState("ALL");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserRoleName, setSelectedUserRoleName] = useState("");
  const [initialUserRoleName, setInitialUserRoleName] = useState("");

  const {
    data: rolesData,
    refetch: refetchRoles,
    isLoading: isLoadingRoles,
    isFetching: isFetchingRoles,
  } = useGetAccessRolesQuery(undefined, {
    skip: !canAccessControl,
  });
  const {
    data: permissionsData,
    refetch: refetchPermissions,
    isLoading: isLoadingPermissions,
    isFetching: isFetchingPermissions,
  } = useGetAccessPermissionsQuery(
    undefined,
    {
      skip: !canAccessControl,
    },
  );
  const {
    data: usersData,
    refetch: refetchUsers,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
  } = useGetAccessUsersQuery(undefined, {
    skip: !canAccessControl,
  });

  const [syncPermissions, { isLoading: isSyncingPermissions }] =
    useSyncAccessPermissionsMutation();
  const [createRole, { isLoading: isCreatingRole }] = useCreateAccessRoleMutation();
  const [updateRolePermissions, { isLoading: isSavingRolePermissions }] =
    useUpdateRolePermissionsMutation();
  const [updateUserRole, { isLoading: isSavingUserRole }] = useUpdateUserRoleMutation();

  const roleList = useMemo(
    () => (Array.isArray(rolesData?.roles) ? rolesData.roles : []),
    [rolesData],
  );
  const permissionList = useMemo(
    () => (Array.isArray(permissionsData?.permissions) ? permissionsData.permissions : []),
    [permissionsData],
  );
  const userList = useMemo(
    () => (Array.isArray(usersData?.users) ? usersData.users : []),
    [usersData],
  );

  const selectedRole = roleList.find((role) => String(role.id) === String(selectedRoleId));
  const selectedUser = userList.find((user) => user.id === selectedUserId);

  const rolePermissionDirty = useMemo(() => {
    return !isSameStringArray(
      normalizeCodes(selectedPermissionCodes),
      normalizeCodes(initialPermissionCodes),
    );
  }, [selectedPermissionCodes, initialPermissionCodes]);

  const userRoleDirty = selectedUserRoleName !== initialUserRoleName;

  const moduleOptions = useMemo(() => {
    const modules = [...new Set(permissionList.map((permission) => getPermissionModule(permission.code)))];
    return ["ALL", ...modules.sort()];
  }, [permissionList]);

  const filteredPermissionList = useMemo(() => {
    const keyword = permissionKeyword.trim().toLowerCase();

    return permissionList.filter((permission) => {
      const module = getPermissionModule(permission.code);
      const inModule = permissionModule === "ALL" || module === permissionModule;
      if (!inModule) return false;

      if (!keyword) return true;

      return (
        permission.code.toLowerCase().includes(keyword) ||
        (permission.description || "").toLowerCase().includes(keyword)
      );
    });
  }, [permissionList, permissionKeyword, permissionModule]);

  const visiblePermissionCodes = filteredPermissionList.map((permission) => permission.code);

  const isBootstrappingAccess = isLoadingRoles || isLoadingPermissions || isLoadingUsers;
  const isRefreshingAccess = isFetchingRoles || isFetchingPermissions || isFetchingUsers;

  const handleSyncPermissions = async () => {
    try {
      const result = await syncPermissions().unwrap();
      toast.success(
        `Đồng bộ xong: +${result.created} mới, ~${result.updated} cập nhật, =${result.unchanged} giữ nguyên, -${result.removed} xóa bỏ, bỏ qua ${result.skipped}.`,
      );
      await Promise.all([refetchPermissions(), refetchRoles()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Đồng bộ permissions thất bại."));
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();

    if (!newRole.name.trim()) {
      toast.error("Vui lòng nhập tên role.");
      return;
    }

    try {
      await createRole({
        name: newRole.name.trim(),
        description: newRole.description.trim() || undefined,
      }).unwrap();
      toast.success("Tạo role thành công.");
      setNewRole({ name: "", description: "" });
      await refetchRoles();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tạo role thất bại."));
    }
  };

  const handleSelectRole = (roleId) => {
    setSelectedRoleId(roleId);
    const role = roleList.find((item) => String(item.id) === String(roleId));
    const codes = role?.permissions?.map((permission) => permission.code) || [];
    const normalized = normalizeCodes(codes);
    setSelectedPermissionCodes(normalized);
    setInitialPermissionCodes(normalized);
  };

  const togglePermissionCode = (code) => {
    setSelectedPermissionCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  };

  const selectAllVisiblePermissions = () => {
    setSelectedPermissionCodes((prev) => normalizeCodes([...prev, ...visiblePermissionCodes]));
  };

  const clearAllVisiblePermissions = () => {
    const visibleSet = new Set(visiblePermissionCodes);
    setSelectedPermissionCodes((prev) => prev.filter((code) => !visibleSet.has(code)));
  };

  const handleSubmitRolePermissions = async (e) => {
    e.preventDefault();

    if (!selectedRoleId) {
      toast.error("Vui lòng chọn role.");
      return;
    }

    if (!rolePermissionDirty) {
      toast.info("Chưa có thay đổi permission để lưu.");
      return;
    }

    try {
      await updateRolePermissions({
        roleId: Number(selectedRoleId),
        permissionCodes: normalizeCodes(selectedPermissionCodes),
      }).unwrap();
      toast.success("Cập nhật permission cho role thành công.");
      const normalized = normalizeCodes(selectedPermissionCodes);
      setInitialPermissionCodes(normalized);
      setSelectedPermissionCodes(normalized);
      await refetchRoles();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cập nhật permission thất bại."));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    const user = userList.find((item) => item.id === userId);
    const assignedRoleName = user?.role?.name || user?.roles?.[0]?.name || "";
    setSelectedUserRoleName(assignedRoleName);
    setInitialUserRoleName(assignedRoleName);
  };

  const handleSubmitUserRole = async (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error("Vui lòng chọn user.");
      return;
    }

    if (!selectedUserRoleName) {
      toast.error("User phải có 1 role.");
      return;
    }

    if (!userRoleDirty) {
      toast.info("Role của user chưa thay đổi.");
      return;
    }

    try {
      await updateUserRole({
        userId: selectedUserId,
        roleName: selectedUserRoleName,
      }).unwrap();
      toast.success("Cập nhật role cho user thành công.");
      setInitialUserRoleName(selectedUserRoleName);
      await Promise.all([refetchUsers(), refetchRoles()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cập nhật role cho user thất bại."));
    }
  };

  if (canAccessControl && isBootstrappingAccess) {
    return (
      <PageLoader
        title="Đang tải dữ liệu phân quyền..."
        description="Hệ thống đang tải vai trò, quyền và người dùng."
      />
    );
  }

  if (!canAccessControl) {
    return (
      <div className="p-6">
        <Card className="p-6 text-sm text-muted-foreground">
          Bạn chưa có quyền truy cập trang quản lý phân quyền.
        </Card>
      </div>
    );
  }

  return (
    <DashboardPageShell
      title="Phân quyền hệ thống"
      description="Đồng bộ permission, tạo role mới và phân vai trò cho người dùng ngay trong dashboard."
      className="relative space-y-4 p-4 md:p-6"
    >
      <OverlayLoader show={isRefreshingAccess && !isBootstrappingAccess} label="Đang cập nhật dữ liệu phân quyền..." />
      <AccessSyncCard onSync={handleSyncPermissions} isSyncingPermissions={isSyncingPermissions} />
      <CreateRoleCard
        newRole={newRole}
        setNewRole={setNewRole}
        onSubmit={handleCreateRole}
        isCreatingRole={isCreatingRole}
      />

      <div className="grid gap-4 2xl:grid-cols-2">
        <RolePermissionCard
          roleList={roleList}
          selectedRoleId={selectedRoleId}
          onSelectRole={handleSelectRole}
          selectedRole={selectedRole}
          isFetchingPermissions={isFetchingPermissions}
          permissionKeyword={permissionKeyword}
          setPermissionKeyword={setPermissionKeyword}
          permissionModule={permissionModule}
          setPermissionModule={setPermissionModule}
          moduleOptions={moduleOptions}
          filteredPermissionList={filteredPermissionList}
          selectedPermissionCodes={selectedPermissionCodes}
          rolePermissionDirty={rolePermissionDirty}
          onSelectAllVisiblePermissions={selectAllVisiblePermissions}
          onClearAllVisiblePermissions={clearAllVisiblePermissions}
          onTogglePermissionCode={togglePermissionCode}
          onSubmit={handleSubmitRolePermissions}
          isSavingRolePermissions={isSavingRolePermissions}
        />

        <UserRoleCard
          userList={userList}
          selectedUserId={selectedUserId}
          onSelectUser={handleSelectUser}
          selectedUser={selectedUser}
          isFetchingUsers={isFetchingUsers}
          selectedUserRoleName={selectedUserRoleName}
          setSelectedUserRoleName={setSelectedUserRoleName}
          roleList={roleList}
          onSubmit={handleSubmitUserRole}
          isSavingUserRole={isSavingUserRole}
          userRoleDirty={userRoleDirty}
        />
      </div>
    </DashboardPageShell>
  );
}
