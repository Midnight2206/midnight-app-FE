import { TableSkeleton } from "@/components/AppSkeletons";
import { OverlayLoader } from "@/components/AppLoading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AuditLogCard({
  isFetchingAudits,
  isLoadingAudits,
  auditLimit,
  setAuditLimit,
  setAuditPage,
  onRefreshAudits,
  audits,
  auditPagination,
}) {
  return (
    <Card className="relative space-y-3 p-4">
      <OverlayLoader show={isFetchingAudits && !isLoadingAudits} label="Đang cập nhật audit log..." />
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Audit log tài khoản</h2>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={auditLimit}
          onChange={(e) => {
            setAuditLimit(Number(e.target.value));
            setAuditPage(1);
          }}
        >
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
        <Button variant="outline" onClick={onRefreshAudits} disabled={isFetchingAudits}>
          Làm mới log
        </Button>
      </div>

      {isLoadingAudits ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Thời gian</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Actor</th>
                  <th className="px-3 py-2 text-left">Target</th>
                  <th className="px-3 py-2 text-left">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Chưa có dữ liệu audit.
                    </td>
                  </tr>
                ) : (
                  audits.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-3 py-2">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2">{log.action}</td>
                      <td className="px-3 py-2">
                        {log.actorUser?.username} ({log.actorUser?.email})
                      </td>
                      <td className="px-3 py-2">
                        {log.targetUser?.username} ({log.targetUser?.email})
                      </td>
                      <td className="px-3 py-2">{log.metadata ? JSON.stringify(log.metadata) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Trang {auditPagination.page}/{auditPagination.totalPages} - Tổng {auditPagination.total} log
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={auditPagination.page <= 1}
                onClick={() => setAuditPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={auditPagination.page >= auditPagination.totalPages}
                onClick={() =>
                  setAuditPage((prev) => Math.min(auditPagination.totalPages, prev + 1))
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

