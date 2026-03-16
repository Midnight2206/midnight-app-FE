import { Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/AppSkeletons";
import { OverlayLoader, SectionLoader } from "@/components/AppLoading";
import DataPagination from "@/components/DataPagination";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatMilitaryTypeList } from "../typeUtils";

function formatGender(value) {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "MALE") return "Nam";
  if (normalized === "FEMALE") return "Nữ";
  return "-";
}

function getRegistrationLockMessage(reason) {
  if (reason === "PENDING_TRANSFER") {
    return "Đang chờ chuyển đơn vị, không thể đăng ký.";
  }
  if (reason === "TRANSFER_ACCEPTED") {
    return "Đã chuyển đơn vị trong năm này, không thể đăng ký.";
  }
  if (reason === "TRANSFERRED_OUT") {
    return "Quân nhân không còn thuộc đơn vị trong năm này.";
  }
  return "Không thể đăng ký cỡ số.";
}

export default function MilitarySizeListTab({
  isSuperAdmin,
  newRegistrationYear,
  setNewRegistrationYear,
  handleCreateRegistrationYear,
  isCreatingRegistrationYear,
  isLoadingRegistrationList,
  sizeTableCategories,
  registrationListError,
  isFetchingRegistrationList,
  selectedYear,
  canManageRegistrationPeriod,
  isUpsertingRegistrationPeriod,
  handleChangeRegistrationPeriodStatus,
  isSelectedYearOpen,
  registrationMilitaries,
  canRegisterSizes,
  handleOpenRegistrationDialog,
  registrationCurrentPage,
  registrationTotalPages,
  registrationTotal,
  onPageChange,
}) {
  const hasRegisterableCategories = sizeTableCategories.length > 0;

  return (
    <>
      {isSuperAdmin && (
        <Card className="surface p-4 md:p-5 space-y-3">
          <div className="data-toolbar">
            <h3 className="text-sm font-medium">Danh mục năm đăng ký</h3>
            <Input
              type="number"
              value={String(newRegistrationYear)}
              onChange={(e) => setNewRegistrationYear(Number(e.target.value))}
              className="w-36"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateRegistrationYear}
              disabled={isCreatingRegistrationYear}
            >
              {isCreatingRegistrationYear ? "Đang thêm..." : "Thêm năm"}
            </Button>
          </div>
        </Card>
      )}

      {isLoadingRegistrationList ? (
        <TableSkeleton rows={10} cols={6 + Math.max(sizeTableCategories.length, 1)} />
      ) : registrationListError ? (
        <SectionLoader
          label={getApiErrorMessage(registrationListError, "Không tải được danh sách cỡ số theo năm.")}
          textClassName="text-destructive"
        />
      ) : (
        <Card className="relative surface overflow-hidden">
          <OverlayLoader
            show={isFetchingRegistrationList && !isLoadingRegistrationList}
            label="Đang cập nhật danh sách cỡ số..."
          />
          <div className="border-b px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Bảng cỡ số quân nhân năm {selectedYear}</h3>
              {canManageRegistrationPeriod && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUpsertingRegistrationPeriod}
                    onClick={() =>
                      handleChangeRegistrationPeriodStatus(
                        isSelectedYearOpen ? "LOCKED" : "OPEN",
                      )
                    }
                  >
                    {isSelectedYearOpen ? "Khóa đợt" : "Mở đợt"}
                  </Button>
                </div>
              )}
            </div>
            {!hasRegisterableCategories && (
              <p className="mt-2 text-xs text-muted-foreground">
                Các danh mục onesize không cần đăng ký, nên được ẩn khỏi bảng này.
              </p>
            )}
          </div>
          <div className="data-table-wrap border-0 rounded-none">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Mã quân nhân</th>
                  <th>Họ tên</th>
                  <th>Giới tính</th>
                  <th>Loại</th>
                  <th>Đơn vị</th>
                  {hasRegisterableCategories ? (
                    sizeTableCategories.map((category) => (
                      <th key={`size-col-${category.id}`}>{category.name}</th>
                    ))
                  ) : null}
                  {canRegisterSizes && hasRegisterableCategories && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {registrationMilitaries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        5 +
                        (hasRegisterableCategories ? sizeTableCategories.length : 0) +
                        (canRegisterSizes && hasRegisterableCategories ? 1 : 0)
                      }
                      className="py-6 text-center text-muted-foreground"
                    >
                      Không có dữ liệu quân nhân.
                    </td>
                  </tr>
                ) : (
                  registrationMilitaries.map((m) => (
                    <tr key={`size-year-${m.id}`}>
                      <td>{m.militaryCode || "-"}</td>
                      <td>{m.fullname || "-"}</td>
                      <td>{formatGender(m.gender)}</td>
                      <td>{formatMilitaryTypeList(m.types?.length ? m.types : m.type)}</td>
                      <td>{m.assignedUnit || "-"}</td>
                      {hasRegisterableCategories ? (
                        sizeTableCategories.map((category) => {
                          const matched = (m.yearlyRegistrations || []).find(
                            (item) => item.categoryId === category.id,
                          );
                          return (
                            <td key={`size-cell-${m.id}-${category.id}`}>
                              {matched?.size?.name || "-"}
                            </td>
                          );
                        })
                      ) : null}
                      {canRegisterSizes && hasRegisterableCategories && (
                        <td>
                          {(() => {
                            const isEligible = m?.canRegisterSizes !== false;
                            const disabledMessage = getRegistrationLockMessage(
                              m?.registrationLockReason,
                            );
                            return (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleOpenRegistrationDialog(m)}
                            disabled={!isEligible}
                            title={!isEligible ? disabledMessage : undefined}
                          >
                            <Ruler className="h-3.5 w-3.5" />
                            Đăng ký
                          </Button>
                            );
                          })()}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DataPagination
            page={registrationCurrentPage}
            totalPages={registrationTotalPages}
            total={registrationTotal}
            isFetching={isFetchingRegistrationList}
            onPageChange={onPageChange}
            label="quân nhân"
          />
        </Card>
      )}
    </>
  );
}
