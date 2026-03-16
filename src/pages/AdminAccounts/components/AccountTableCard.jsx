import { TableSkeleton } from "@/components/AppSkeletons";
import { OverlayLoader, SectionLoader } from "@/components/AppLoading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/utils/apiError";

export default function AccountTableCard({
  isFetching,
  isLoading,
  error,
  search,
  setSearch,
  limit,
  setLimit,
  onRefresh,
  accounts,
  accountPagination,
  isUpdatingStatus,
  onToggleStatus,
  onOpenResetModal,
  setPage,
}) {
  return (
    <Card className="relative space-y-3 p-4">
      <OverlayLoader show={isFetching && !isLoading} label="Đang cập nhật danh sách tài khoản..." />
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Quản lý tài khoản hệ thống</h2>
        <Input
          className="max-w-xs"
          placeholder="Tìm email hoặc username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
        <Button variant="outline" onClick={onRefresh} disabled={isFetching}>
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : error ? (
        <SectionLoader
          label={getApiErrorMessage(error, "Không tải được danh sách tài khoản.")}
          textClassName="text-destructive"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Roles</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      Không có tài khoản.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="border-t">
                      <td className="px-3 py-2">{account.username}</td>
                      <td className="px-3 py-2">{account.email}</td>
                      <td className="px-3 py-2">{(account.roles || []).join(", ")}</td>
                      <td className="px-3 py-2">
                        {account.unit?.id} - {account.unit?.name}
                      </td>
                      <td className="px-3 py-2">{account.isActive ? "Hoạt động" : "Đã khóa"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={account.isActive ? "destructive" : "default"}
                            disabled={
                              isUpdatingStatus ||
                              isFetching ||
                              (account.roles || []).includes("SUPER_ADMIN")
                            }
                            onClick={() => onToggleStatus(account)}
                          >
                            {account.isActive ? "Khóa" : "Mở"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={(account.roles || []).includes("SUPER_ADMIN")}
                            onClick={() => onOpenResetModal(account)}
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

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Trang {accountPagination.page}/{accountPagination.totalPages} - Tổng{" "}
              {accountPagination.total} tài khoản
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={accountPagination.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={accountPagination.page >= accountPagination.totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(accountPagination.totalPages, prev + 1))
                }
              >
                Sau
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

