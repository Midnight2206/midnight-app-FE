import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/AppSkeletons";
import { OverlayLoader } from "@/components/AppLoading";
import DataPagination from "@/components/DataPagination";
import { useGetAccountAuditsQuery } from "@/features/account/accountApi";
import { ACCESS_RULES } from "@/features/auth/authorization";
import { useAuthorization } from "@/features/auth/useAuthorization";
import { getPaginationMeta } from "@/utils/pagination";

export default function AccountAuditPage() {
  const { can } = useAuthorization();
  const canAccessAccountDashboard = can(ACCESS_RULES.accountDashboardPage);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryParams = useMemo(() => ({ page, limit }), [page, limit]);

  const { data, isLoading, isFetching, refetch } = useGetAccountAuditsQuery(queryParams, {
    skip: !canAccessAccountDashboard,
    refetchOnMountOrArgChange: true,
  });

  const audits = Array.isArray(data?.items) ? data.items : [];
  const pagination = getPaginationMeta(data, 10);

  if (!canAccessAccountDashboard) {
    return (
      <Card className="surface p-6 text-sm text-muted-foreground">
        Bạn chưa có quyền truy cập khu vực nhật ký hệ thống.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="surface relative p-4 md:p-5 space-y-3">
        <OverlayLoader show={isFetching && !isLoading} label="Đang cập nhật audit log..." />
        <div className="data-toolbar">
          <h2 className="text-lg font-semibold">Audit log tài khoản</h2>
          <select
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
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Làm mới log
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table min-w-[920px]">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-8">
                        Chưa có dữ liệu audit.
                      </td>
                    </tr>
                  ) : (
                    audits.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                        <td>{log.action}</td>
                        <td>
                          {log.actorUser?.username} ({log.actorUser?.email})
                        </td>
                        <td>
                          {log.targetUser?.username} ({log.targetUser?.email})
                        </td>
                        <td className="max-w-[320px] break-words">
                          {log.metadata ? JSON.stringify(log.metadata) : "-"}
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
              label="log"
              compact
            />
          </>
        )}
      </Card>
    </div>
  );
}
