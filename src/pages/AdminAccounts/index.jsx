import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateAdminAccountMutation,
  useGetAccountAuditsQuery,
  useGetAccountsQuery,
  useGetAccountUnitsQuery,
  useResetAccountPasswordMutation,
  useUpdateAccountStatusMutation,
} from "@/features/account/accountApi";
import { ACCESS_RULES } from "@/features/auth/authorization";
import { useAuthorization } from "@/features/auth/useAuthorization";
import { getApiErrorMessage } from "@/utils/apiError";
import ResetPasswordDialog from "./components/ResetPasswordDialog";
import AccountTableCard from "./components/AccountTableCard";
import AuditLogCard from "./components/AuditLogCard";

function getAccounts(data) {
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.accounts)) return data.accounts;
  return [];
}

function getPagination(data) {
  return (
    data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    }
  );
}

function getAudits(data) {
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export default function AdminAccountsPage() {
  const { can } = useAuthorization();
  const canAccessAccountDashboard = can(ACCESS_RULES.accountDashboardPage);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(10);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    unitId: "",
  });

  const [resetModal, setResetModal] = useState({
    open: false,
    userId: "",
    username: "",
    newPassword: "",
  });

  const accountQueryParams = useMemo(
    () => ({
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [search, page, limit],
  );

  const auditQueryParams = useMemo(
    () => ({
      page: auditPage,
      limit: auditLimit,
    }),
    [auditPage, auditLimit],
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useGetAccountsQuery(accountQueryParams, {
    skip: !canAccessAccountDashboard,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: auditsData,
    isLoading: isLoadingAudits,
    isFetching: isFetchingAudits,
    refetch: refetchAudits,
  } = useGetAccountAuditsQuery(auditQueryParams, {
    skip: !canAccessAccountDashboard,
    refetchOnMountOrArgChange: true,
  });

  const { data: unitsData } = useGetAccountUnitsQuery(undefined, {
    skip: !canAccessAccountDashboard,
  });

  const [createAdmin, { isLoading: isCreating }] =
    useCreateAdminAccountMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateAccountStatusMutation();
  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetAccountPasswordMutation();

  const accounts = getAccounts(data);
  const accountPagination = getPagination(data);
  const audits = getAudits(auditsData);
  const auditPagination = getPagination(auditsData);
  const units = Array.isArray(unitsData?.units) ? unitsData.units : [];

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.username || !form.password || !form.unitId) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      await createAdmin({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        unitId: Number(form.unitId),
      }).unwrap();
      toast.success("Tạo tài khoản admin thành công.");
      setForm({ email: "", username: "", password: "", unitId: "" });
      setPage(1);
      await Promise.all([refetch(), refetchAudits()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tạo admin thất bại."));
    }
  };

  const handleToggleStatus = async (account) => {
    try {
      await updateStatus({
        userId: account.id,
        isActive: !account.isActive,
      }).unwrap();
      toast.success("Cập nhật trạng thái thành công.");
      await Promise.all([refetch(), refetchAudits()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cập nhật trạng thái thất bại."));
    }
  };

  const openResetModal = (account) => {
    setResetModal({
      open: true,
      userId: account.id,
      username: account.username,
      newPassword: "",
    });
  };

  const closeResetModal = () => {
    setResetModal((prev) => ({
      ...prev,
      open: false,
      newPassword: "",
    }));
  };

  const handleConfirmResetPassword = async () => {
    if (!resetModal.newPassword || resetModal.newPassword.length < 8) {
      toast.error("Mật khẩu mới tối thiểu 8 ký tự.");
      return;
    }

    try {
      await resetPassword({
        userId: resetModal.userId,
        newPassword: resetModal.newPassword,
      }).unwrap();
      toast.success("Reset mật khẩu thành công.");
      closeResetModal();
      await refetchAudits();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Reset mật khẩu thất bại."));
    }
  };

  if (!canAccessAccountDashboard) {
    return (
      <div className="p-6">
        <Card className="p-6 text-sm text-muted-foreground">
          Bạn chưa có quyền truy cập khu vực quản lý tài khoản.
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <ResetPasswordDialog
        resetModal={resetModal}
        setResetModal={setResetModal}
        onClose={closeResetModal}
        onConfirm={handleConfirmResetPassword}
        isResettingPassword={isResettingPassword}
      />

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">Tạo tài khoản ADMIN</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateAdmin}>
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, username: e.target.value }))
            }
          />
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={form.unitId}
            onChange={(e) => setForm((prev) => ({ ...prev, unitId: e.target.value }))}
          >
            <option value="">Chọn đơn vị</option>
            {units
              .filter((unit) => unit.id !== 1)
              .map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.id} - {unit.name}
                </option>
              ))}
          </select>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Đang tạo..." : "Tạo ADMIN"}
            </Button>
          </div>
        </form>
      </Card>

      <AccountTableCard
        isFetching={isFetching}
        isLoading={isLoading}
        error={error}
        search={search}
        setSearch={setSearch}
        limit={limit}
        setLimit={setLimit}
        onRefresh={refetch}
        accounts={accounts}
        accountPagination={accountPagination}
        isUpdatingStatus={isUpdatingStatus}
        onToggleStatus={handleToggleStatus}
        onOpenResetModal={openResetModal}
        setPage={setPage}
      />

      <AuditLogCard
        isFetchingAudits={isFetchingAudits}
        isLoadingAudits={isLoadingAudits}
        auditLimit={auditLimit}
        setAuditLimit={setAuditLimit}
        setAuditPage={setAuditPage}
        onRefreshAudits={refetchAudits}
        audits={audits}
        auditPagination={auditPagination}
      />
    </div>
  );
}
