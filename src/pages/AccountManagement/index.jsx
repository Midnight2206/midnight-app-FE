import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/AppSkeletons";
import { OverlayLoader } from "@/components/AppLoading";
import DataPagination from "@/components/DataPagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetAccountsQuery,
  useResetAccountPasswordMutation,
  useUpdateAccountStatusMutation,
} from "@/features/account/accountApi";
import { ACCESS_RULES } from "@/features/auth/authorization";
import { useAuthorization } from "@/features/auth/useAuthorization";
import { getPaginationMeta } from "@/utils/pagination";
import { getApiErrorMessage } from "@/utils/apiError";
import { DISPLAY_LABELS } from "@/utils/constants";
import DashboardPageShell from "@/layouts/components/DashboardPageShell";

export default function AccountManagementPage() {
  const { can } = useAuthorization();
  const canAccessAccountDashboard = can(ACCESS_RULES.accountDashboardPage);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [claimStatus, setClaimStatus] = useState("all");

  const [resetModal, setResetModal] = useState({
    open: false,
    userId: "",
    username: "",
    newPassword: "",
  });

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(claimStatus !== "all" ? { claimStatus } : {}),
    }),
    [search, page, limit, claimStatus],
  );

  const { data, isLoading, isFetching, refetch, error } = useGetAccountsQuery(
    queryParams,
    {
      skip: !canAccessAccountDashboard,
      refetchOnMountOrArgChange: true,
    },
  );

  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateAccountStatusMutation();
  const [resetPassword, { isLoading: isResettingPassword }] =
    useResetAccountPasswordMutation();

  const accounts = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.accounts)
      ? data.accounts
      : [];
  const pagination = getPaginationMeta(data, 10);

  const handleToggleStatus = async (account) => {
    try {
      await updateStatus({
        userId: account.id,
        isActive: !account.isActive,
      }).unwrap();
      toast.success("Cập nhật trạng thái thành công.");
      await refetch();
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
    setResetModal((prev) => ({ ...prev, open: false, newPassword: "" }));
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Reset mật khẩu thất bại."));
    }
  };

  if (!canAccessAccountDashboard) {
    return (
      <Card className="surface p-6 text-sm text-muted-foreground">
        Bạn chưa có quyền truy cập khu vực quản lý tài khoản.
      </Card>
    );
  }

  return (
    <DashboardPageShell
      title="Quản lý tài khoản hệ thống"
      description="Theo dõi tài khoản, khóa mở, đặt lại mật khẩu và kiểm tra trạng thái liên kết trên cùng một màn hình."
      className="space-y-4 p-4 md:p-6"
    >
      <Dialog
        open={resetModal.open}
        onOpenChange={(open) => !open && closeResetModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset mật khẩu tài khoản</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu mới cho tài khoản <b>{resetModal.username}</b>.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Mật khẩu mới (>= 8 ký tự)"
            value={resetModal.newPassword}
            onChange={(e) =>
              setResetModal((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={closeResetModal}
            >
              Hủy
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleConfirmResetPassword}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? "Đang xử lý..." : "Xác nhận reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="surface relative space-y-3 p-4 md:p-5">
        <OverlayLoader
          show={isFetching && !isLoading}
          label="Đang cập nhật danh sách tài khoản..."
        />
        <div className="data-toolbar flex-col items-stretch sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold sm:mr-auto">
            Quản lý tài khoản hệ thống
          </h2>
          <Input
            className="w-full sm:max-w-xs"
            placeholder="Tìm email hoặc username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="w-full sm:w-auto"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
          <select
            className="w-full sm:w-auto"
            value={claimStatus}
            onChange={(e) => {
              setClaimStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả trạng thái liên kết</option>
            <option value="claimed">Đã liên kết</option>
            <option value="unclaimed">Chưa liên kết</option>
          </select>
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Làm mới
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : error ? (
          <Card className="p-4 text-sm text-destructive">
            {getApiErrorMessage(error, "Không tải được danh sách tài khoản.")}
          </Card>
        ) : (
          <>
            <div className="data-table-wrap -mx-4 sm:mx-0">
              <table className="data-table min-w-[1100px]">
                <thead>
                  <tr>
                    <th>{DISPLAY_LABELS.username}</th>
                    <th>Email</th>
                    <th>{DISPLAY_LABELS.roles}</th>
                    <th>{DISPLAY_LABELS.unit}</th>
                    <th>Quân nhân</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        Không có tài khoản.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id}>
                        <td>{account.username}</td>
                        <td>{account.email}</td>
                        <td>{(account.roles || []).join(", ")}</td>
                        <td>
                          {account.unit?.id} - {account.unit?.name}
                        </td>
                        <td>
                          {account.military ? (
                            <div className="space-y-0.5">
                              <p className="font-medium">
                                {account.military.fullname}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {account.military.militaryCode}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Chưa claim
                            </span>
                          )}
                        </td>
                        <td>{account.isActive ? "Hoạt động" : "Đã khóa"}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant={
                                account.isActive ? "destructive" : "default"
                              }
                              disabled={
                                isUpdatingStatus ||
                                isFetching ||
                                (account.roles || []).includes("SUPER_ADMIN")
                              }
                              onClick={() => handleToggleStatus(account)}
                            >
                              {account.isActive ? "Khóa" : "Mở"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={(account.roles || []).includes(
                                "SUPER_ADMIN",
                              )}
                              onClick={() => openResetModal(account)}
                            >
                              Reset mật khẩu
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <DataPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              isFetching={isFetching}
              onPageChange={setPage}
              label="tài khoản"
              compact
            />
          </>
        )}
      </Card>
    </DashboardPageShell>
  );
}
