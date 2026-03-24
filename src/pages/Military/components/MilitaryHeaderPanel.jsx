import { ArrowDown, ArrowUp, Plus, RefreshCw, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MilitaryHeaderPanel({
  isSuperAdmin,
  newUnitName,
  setNewUnitName,
  handleCreateUnit,
  isCreatingUnit,
  units,
  selectedUnitId,
  setSelectedUnitId,
  setPage,
  adminUnit,
  user,
  refreshAll,
  isFetching,
  handleReset,
  isResetting,
  canImport,
  setOpenMilitaryImportDialog,
  canRegisterSizes,
  setOpenRegistrationImportDialog,
  openListHeaderFilters,
  setOpenListHeaderFilters,
  selectedYear,
  yearOptions,
  yearStatusMap,
  setSelectedYear,
  selectedType,
  selectedTypeLabel,
  setSelectedType,
  militaryTypes,
  newTypeCode,
  setNewTypeCode,
  handleCreateType,
  isCreatingType,
  handleDeleteType,
  isDeletingType,
  searchInput,
  setSearchInput,
  setSearchTerm,
  militariesCount,
  claimedCount,
  unclaimedCount,
  limit,
  setLimit,
}) {
  return (
    <>
      {isSuperAdmin && (
        <Card className="surface p-4 md:p-5 space-y-3">
          <h2 className="text-base font-semibold">Tạo đơn vị mới</h2>
          <form className="data-toolbar" onSubmit={handleCreateUnit}>
            <Input
              className="w-full md:max-w-sm"
              placeholder="Nhập tên đơn vị"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
            />
            <Button type="submit" disabled={isCreatingUnit}>
              {isCreatingUnit ? "Đang tạo..." : "Tạo đơn vị"}
            </Button>
          </form>
        </Card>
      )}

      <Card className="surface p-4 md:p-5 space-y-3">
        <div className="data-toolbar">
          <h2 className="text-lg font-semibold">Danh sách quân nhân</h2>

          {isSuperAdmin ? (
            <select
              value={selectedUnitId}
              onChange={(e) => {
                setSelectedUnitId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả đơn vị</option>
              {units.map((unit) => (
                <option key={unit.id} value={String(unit.id)}>
                  {unit.id} - {unit.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">
              Đơn vị:{" "}
              {adminUnit
                ? `${adminUnit.id} - ${adminUnit.name}`
                : `#${user?.unitId || "-"}`}
            </p>
          )}

          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>

          {isSuperAdmin && (
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? "Đang reset..." : "Reset dữ liệu"}
            </Button>
          )}

          {canImport && (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setOpenMilitaryImportDialog(true)}
            >
              <Upload className="h-4 w-4" />
              Import quân nhân
            </Button>
          )}

          {canRegisterSizes && (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setOpenRegistrationImportDialog(true)}
            >
              <Upload className="h-4 w-4" />
              Import cỡ số
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setOpenListHeaderFilters((prev) => !prev)}
          >
            {openListHeaderFilters ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            {openListHeaderFilters ? "Thu gọn bộ lọc" : "Mở bộ lọc"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Danh sách đang xem:{" "}
          <span className="font-medium text-foreground">
            {selectedTypeLabel}
          </span>
        </p>
        {openListHeaderFilters ? (
          <>
            <div className="grid gap-3 md:grid-cols-[220px_220px_minmax(0,1fr)]">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Năm áp dụng (dùng chung)
                </p>
                <select
                  value={String(selectedYear)}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  {yearOptions.length > 0 ? (
                    yearOptions.map((year) => (
                      <option key={year} value={String(year)}>
                        Năm {year}
                        {yearStatusMap.get(year)
                          ? ` (${yearStatusMap.get(year) === "OPEN" ? "mở" : "khóa"})`
                          : ""}
                      </option>
                    ))
                  ) : (
                    <option value={String(selectedYear)}>
                      Năm {selectedYear}
                    </option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Loại quân nhân</p>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  disabled={militaryTypes.length === 0}
                >
                  {militaryTypes.length === 0 ? (
                    <option value="">Chưa có danh sách</option>
                  ) : null}
                  {militaryTypes.map((item) => (
                    <option
                      key={`mil-type-filter-${item.id}`}
                      value={item.code}
                    >
                      {item.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Tìm kiếm (dùng chung)
                </p>
                <div className="relative">
                  <Input
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Tìm theo họ tên, mã quân nhân, cấp bậc, chức vụ, đơn vị..."
                    className="pr-9"
                  />
                  {searchInput.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearchTerm("");
                        setPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Xóa từ khóa tìm kiếm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            {isSuperAdmin && (
              <div className="space-y-2 rounded-md border border-border/70 bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Quản lý danh mục loại quân nhân
                </p>
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={handleCreateType}
                >
                  <Input
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value)}
                    placeholder="Nhập mã loại mới (VD: SQDB)"
                    className="w-full md:w-64"
                  />
                  <Button type="submit" size="sm" disabled={isCreatingType}>
                    <Plus className="mr-1 h-4 w-4" />
                    {isCreatingType ? "Đang thêm..." : "Thêm loại"}
                  </Button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {militaryTypes.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Chưa có dữ liệu loại quân nhân.
                    </span>
                  ) : (
                    militaryTypes.map((item) => (
                      <span
                        key={`mil-type-chip-${item.id}`}
                        className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs"
                      >
                        {item.code}
                        <button
                          type="button"
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => handleDeleteType(item)}
                          disabled={isDeletingType}
                          aria-label={`Xóa loại ${item.code}`}
                          title={`Xóa loại ${item.code}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Trạng thái năm {selectedYear}:{" "}
              {yearStatusMap.get(selectedYear) === "OPEN"
                ? "Đang mở đăng ký"
                : yearStatusMap.get(selectedYear) === "LOCKED"
                  ? "Đang khóa"
                  : "Chưa có đợt đăng ký cho năm này"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-1">
                Tổng: {militariesCount}
              </span>
              <span className="rounded-full border px-2 py-1">
                Đã claim: {claimedCount}
              </span>
              <span className="rounded-full border px-2 py-1">
                Chưa claim: {unclaimedCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hiển thị</span>
              <select
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              >
                <option value="10">10 / trang</option>
                <option value="20">20 / trang</option>
                <option value="50">50 / trang</option>
              </select>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Bộ lọc đang thu gọn. Năm hiện tại: {selectedYear}. Danh sách:{" "}
            {selectedTypeLabel}
          </p>
        )}
      </Card>
    </>
  );
}
