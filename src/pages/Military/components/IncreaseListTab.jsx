import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OverlayLoader } from "@/components/AppLoading";
import { DISPLAY_LABELS } from "@/utils/constants";
import { formatMilitaryTypeList } from "../typeUtils";
import ExternalIncreaseForm from "./ExternalIncreaseForm";

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
  externalIncreaseForm,
  onExternalIncreaseFieldChange,
  onSubmitExternalIncrease,
  isSubmittingExternalIncrease,
  currentAdminUnitName,
  assignedUnits,
  militaryTypes,
}) {
  const [pendingAssignedUnits, setPendingAssignedUnits] = useState({});
  const assignedUnitOptions = Array.isArray(assignedUnits) ? assignedUnits : [];

  useEffect(() => {
    setPendingAssignedUnits((prev) => {
      const validIds = new Set(
        assignedUnitOptions.map((item) => String(item.id)),
      );
      const next = {};
      for (const [requestId, assignedUnitId] of Object.entries(prev)) {
        if (validIds.has(String(assignedUnitId))) {
          next[requestId] = assignedUnitId;
        }
      }
      return next;
    });
  }, [assignedUnitOptions]);

  return (
    <Card className="relative surface overflow-hidden">
      <OverlayLoader
        show={
          (isFetching && !isLoading) ||
          (isFetchingIncomingTransferRequests &&
            !isLoadingIncomingTransferRequests)
        }
        label="Đang cập nhật danh sách quân nhân tăng..."
      />
      <ExternalIncreaseForm
        form={externalIncreaseForm}
        onFieldChange={onExternalIncreaseFieldChange}
        onSubmit={onSubmitExternalIncrease}
        isSubmitting={isSubmittingExternalIncrease}
        currentUnitName={currentAdminUnitName}
        assignedUnits={assignedUnits}
        militaryTypes={militaryTypes}
        canManageTransfer={canManageTransfer}
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
                <td
                  colSpan={canManageTransfer ? 12 : 11}
                  className="py-8 text-center text-muted-foreground"
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredIncreaseRows.length === 0 ? (
              <tr>
                <td
                  colSpan={canManageTransfer ? 12 : 11}
                  className="py-8 text-center text-muted-foreground"
                >
                  Không có dữ liệu phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredIncreaseRows.map((row, index) => {
                const military = row.military || {};
                const request = row.request || null;
                const isPendingRequest = request?.id && row.type === "request";
                const toUnitName =
                  request?.toUnit?.name ||
                  military.assignedUnit ||
                  military.transferInDetail?.toUnitName ||
                  "-";
                const fromUnitName =
                  request?.fromUnit?.name ||
                  military.transferInDetail?.fromUnitName ||
                  "-";
                const transferInYear =
                  request?.transferYear ||
                  military.transferInDetail?.transferYear ||
                  military.unitTransferInYear ||
                  "-";
                const typeLabel = isPendingRequest
                  ? formatMilitaryTypeList(request?.type?.code || "-")
                  : formatMilitaryTypeList(
                      military.types?.length ? military.types : military.type,
                    );

                return (
                  <tr
                    key={`${row.type}-${request?.id || military.id || index}`}
                  >
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
                        <span className="text-emerald-700">
                          Đã nhận bảo đảm
                        </span>
                      )}
                    </td>
                    {canManageTransfer && (
                      <td>
                        {isPendingRequest ? (
                          <div className="flex min-w-[240px] flex-col gap-2">
                            <select
                              value={pendingAssignedUnits[request.id] || ""}
                              onChange={(event) =>
                                setPendingAssignedUnits((prev) => ({
                                  ...prev,
                                  [request.id]: event.target.value,
                                }))
                              }
                              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                            >
                              <option value="">
                                Chọn {DISPLAY_LABELS.assignedUnit}
                              </option>
                              {assignedUnitOptions.map((item) => (
                                <option key={item.id} value={String(item.id)}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              onClick={() =>
                                onAcceptTransferRequest(
                                  request.id,
                                  pendingAssignedUnits[request.id] || "",
                                )
                              }
                              disabled={isAcceptingTransferRequest}
                            >
                              Nhận bảo đảm
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
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
