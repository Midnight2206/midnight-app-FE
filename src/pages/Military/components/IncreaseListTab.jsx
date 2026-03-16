import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OverlayLoader } from "@/components/AppLoading";
import { formatMilitaryTypeList } from "../typeUtils";

function formatGender(value) {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "MALE") return "Nam";
  if (normalized === "FEMALE") return "Nữ";
  return "-";
}

export default function IncreaseListTab({
  selectedYear,
  isFetching,
  isLoading,
  isFetchingIncomingTransferRequests,
  isLoadingIncomingTransferRequests,
  increaseQuickFilter,
  setIncreaseQuickFilter,
  filteredIncreaseRows,
  canManageTransfer,
  onAcceptTransferRequest,
  isAcceptingTransferRequest,
}) {
  return (
    <Card className="relative surface overflow-hidden">
      <OverlayLoader
        show={
          (isFetching && !isLoading) ||
          (isFetchingIncomingTransferRequests && !isLoadingIncomingTransferRequests)
        }
        label="Đang cập nhật danh sách quân nhân tăng..."
      />
      <div className="border-b px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            Quân nhân tăng và yêu cầu nhận bảo đảm năm {selectedYear}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Lọc nhanh</span>
            <select
              value={increaseQuickFilter}
              onChange={(e) => setIncreaseQuickFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ nhận</option>
              <option value="accepted">Đã nhận</option>
            </select>
          </div>
        </div>
      </div>
      <div className="data-table-wrap border-0 rounded-none">
        <table className="data-table min-w-[1360px]">
          <thead>
            <tr>
              <th>Mã quân nhân</th>
              <th>Họ tên</th>
              <th>Cấp bậc</th>
              <th>Giới tính</th>
              <th>Loại</th>
              <th>Năm PH, CCĐ lần đầu</th>
              <th>Chức vụ</th>
              <th>Đơn vị đi</th>
              <th>Đơn vị đến</th>
              <th>Năm chuyển đến</th>
              <th>Trạng thái</th>
              {canManageTransfer && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading || isLoadingIncomingTransferRequests ? (
              <tr>
                <td colSpan={canManageTransfer ? 12 : 11} className="py-8 text-center text-muted-foreground">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredIncreaseRows.length === 0 ? (
              <tr>
                <td colSpan={canManageTransfer ? 12 : 11} className="py-8 text-center text-muted-foreground">
                  Không có dữ liệu phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredIncreaseRows.map((row, index) => {
                const military = row.military || {};
                const request = row.request || null;
                const isPendingRequest = request?.id && row.type === "request";
                const toUnitName = request?.toUnit?.name || military.assignedUnit || "-";
                const fromUnitName = request?.fromUnit?.name || "-";
                const transferInYear = request?.transferYear || military.unitTransferInYear || "-";
                const typeLabel = isPendingRequest
                  ? formatMilitaryTypeList(request?.type?.code || "-")
                  : formatMilitaryTypeList(military.types?.length ? military.types : military.type);

                return (
                  <tr key={`${row.type}-${request?.id || military.id || index}`}>
                    <td>{military.militaryCode || "-"}</td>
                    <td>{military.fullname || "-"}</td>
                    <td>{military.rank || "-"}</td>
                    <td>{formatGender(military.gender)}</td>
                    <td>{typeLabel}</td>
                    <td>{military.initialCommissioningYear || "-"}</td>
                    <td>{military.position || "-"}</td>
                    <td>{fromUnitName}</td>
                    <td>{toUnitName}</td>
                    <td>{transferInYear}</td>
                    <td>
                      {isPendingRequest ? (
                        <span className="text-amber-700">Chờ nhận bảo đảm</span>
                      ) : (
                        <span className="text-emerald-700">Đã nhận bảo đảm</span>
                      )}
                    </td>
                    {canManageTransfer && (
                      <td>
                        {isPendingRequest ? (
                          <Button
                            size="sm"
                            onClick={() => onAcceptTransferRequest(request.id)}
                            disabled={isAcceptingTransferRequest}
                          >
                            Nhận bảo đảm
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
