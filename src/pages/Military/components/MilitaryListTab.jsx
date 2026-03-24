import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/AppSkeletons";
import { OverlayLoader, SectionLoader } from "@/components/AppLoading";
import DataPagination from "@/components/DataPagination";
import { getApiErrorMessage } from "@/utils/apiError";
import MilitaryTransferActionCell from "./MilitaryTransferActionCell";
import { formatMilitaryTypeList } from "../typeUtils";

const SORT_KEYS = [
  ["fullname", "Họ tên"],
  ["militaryCode", "Mã quân nhân"],
  ["initialCommissioningYear", "Năm PH, CCĐ lần đầu"],
  ["rank", "Cấp bậc"],
  ["gender", "Giới tính"],
  ["type", "Loại"],
  ["position", "Chức vụ"],
  ["unit", "Đơn vị"],
  ["claim", "Trạng thái liên kết tài khoản"],
];

function renderSortIcon(sortConfig, key) {
  if (sortConfig.key !== key) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />;
  }
  return sortConfig.direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

function formatGender(value) {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "MALE") return "Nam";
  if (normalized === "FEMALE") return "Nữ";
  return "-";
}

export default function MilitaryListTab({
  isLoading,
  error,
  isFetching,
  sortConfig,
  onSort,
  sortLabel,
  canManageTransfer,
  militaries,
  searchTerm,
  selectedYear,
  currentAdminUnitId,
  isSubmittingCutTransfer,
  onUndoCutTransferRequest,
  onOpenCutTransferDialog,
  currentPage,
  totalPages,
  total,
  onPageChange,
  buildPersonalLedgerPath,
}) {
  if (isLoading) {
    return <TableSkeleton rows={10} cols={11} />;
  }

  if (error) {
    return (
      <SectionLoader
        label={getApiErrorMessage(error, "Không tải được danh sách quân nhân.")}
        textClassName="text-destructive"
      />
    );
  }

  return (
    <Card className="relative surface overflow-hidden">
      <OverlayLoader
        show={isFetching && !isLoading}
        label="Đang cập nhật danh sách quân nhân..."
      />
      <div className="data-table-wrap border-0 rounded-none">
        <table className="data-table min-w-[1160px]">
          <thead>
            <tr>
              {SORT_KEYS.map(([key, label]) => (
                <th key={key}>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 ${sortConfig.key === key ? "font-semibold text-primary" : ""}`}
                    onClick={() => onSort(key)}
                  >
                    {label}
                    {renderSortIcon(sortConfig, key)}
                    {sortConfig.key === key && (
                      <span className="text-[11px] leading-none">
                        {sortLabel}
                      </span>
                    )}
                  </button>
                </th>
              ))}
              {canManageTransfer && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {militaries.length === 0 ? (
              <tr>
                <td
                  colSpan={canManageTransfer ? 12 : 11}
                  className="text-center text-muted-foreground py-8"
                >
                  {searchTerm
                    ? "Không có dữ liệu phù hợp từ khóa tìm kiếm."
                    : "Chưa có dữ liệu quân nhân."}
                </td>
              </tr>
            ) : (
              militaries.map((m) => (
                <tr key={m.id}>
                  <td>
                    {typeof buildPersonalLedgerPath === "function" ? (
                      <Link
                        to={buildPersonalLedgerPath(m)}
                        className="font-medium text-primary hover:underline"
                      >
                        {m.fullname || "-"}
                      </Link>
                    ) : (
                      m.fullname || "-"
                    )}
                  </td>
                  <td>{m.militaryCode || "-"}</td>
                  <td>{m.initialCommissioningYear || "-"}</td>
                  <td>{m.rank || "-"}</td>
                  <td>{formatGender(m.gender)}</td>
                  <td>
                    {formatMilitaryTypeList(m.types?.length ? m.types : m.type)}
                  </td>
                  <td>{m.position || "-"}</td>
                  <td>{m.assignedUnit || "-"}</td>
                  <td>
                    {m.claimedByUserId
                      ? "Đã liên kết tài khoản"
                      : "Chưa liên kết tài khoản"}
                  </td>
                  {canManageTransfer && (
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <MilitaryTransferActionCell
                          military={m}
                          selectedYear={selectedYear}
                          currentAdminUnitId={currentAdminUnitId}
                          isSubmitting={isSubmittingCutTransfer}
                          onUndo={onUndoCutTransferRequest}
                          onOpenCut={onOpenCutTransferDialog}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <DataPagination
        page={currentPage}
        totalPages={totalPages}
        total={total}
        isFetching={isFetching}
        onPageChange={onPageChange}
        label="bản ghi"
      />
    </Card>
  );
}
