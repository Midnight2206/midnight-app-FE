import { useDeferredValue, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import AllocationVoucherPrintDialog from "@/pages/Inventory/components/AllocationVoucherPrintDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateAllocationModeIssueVoucherMutation,
  useGetApplicableAllocationModesQuery,
  useGetAllocationModeEligibilityQuery,
  useGetCategoryWarehousesQuery,
} from "@/features/inventory/inventoryApi";
import { useGetMilitariesQuery } from "@/features/military/militaryApi";
import { getApiErrorMessage } from "@/utils/apiError";

function formatModeScope(scope) {
  return scope === "SYSTEM" ? "Hệ thống" : "Đơn vị";
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatYear(value) {
  return value ? String(value) : "-";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function MilitarySummary({ military }) {
  if (!military) return null;

  return (
    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
      <div>
        <div className="font-medium text-foreground">{military.fullname}</div>
        <div>Mã quân nhân: {military.militaryCode || "-"}</div>
      </div>
      <div>
        <div>Đơn vị: {military.unit?.name || "-"}</div>
        <div>Năm phong/nhập ngũ: {formatYear(military.initialCommissioningYear)}</div>
      </div>
      <div>
        <div>Cấp bậc: {military.rank || "-"}</div>
        <div>Nhóm cấp bậc: {military.rankGroup || "-"}</div>
      </div>
      <div>
        <div>Giới tính: {military.gender || "-"}</div>
        <div>
          Loại quân nhân:{" "}
          {(military.types || [])
            .map((type) => type.name || type.code)
            .filter(Boolean)
            .join(", ") || "-"}
        </div>
      </div>
    </div>
  );
}

function VoucherPreview({ voucher }) {
  if (!voucher) return null;

  return (
    <Card className="space-y-4 rounded-2xl border-primary/15 bg-gradient-to-br from-primary/[0.08] to-background p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <Badge className="bg-primary/90 text-primary-foreground">
            Phiếu vừa tạo
          </Badge>
          <h3 className="text-lg font-semibold">
            {voucher.voucherNo || voucher.id}
          </h3>
          <p className="text-sm text-muted-foreground">
            Tạo lúc {formatDateTime(voucher.issuedAt)} tại kho{" "}
            {voucher.warehouse?.name || "-"}. Người nhận:{" "}
            {voucher.receiverName || "-"}.
          </p>
        </div>
        <AllocationVoucherPrintDialog
          key={voucher.id}
          voucher={voucher}
          triggerLabel="In phiếu vừa tạo"
        />
      </div>

      <div className="overflow-auto rounded-xl border border-border/70 bg-background/80">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2">Quân trang</th>
              <th className="px-3 py-2">Niên hạn</th>
              <th className="px-3 py-2">Năm gần nhất</th>
              <th className="px-3 py-2">Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {(voucher.items || []).map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">
                  {item.categoryName}
                  <div className="text-xs text-muted-foreground">
                    {[
                      item.versionName && item.versionName !== "None"
                        ? item.versionName
                        : null,
                      item.colorName && item.colorName !== "None"
                        ? item.colorName
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" / ") || item.unitOfMeasureName || "-"}
                  </div>
                </td>
                <td className="px-3 py-2">{formatYear(item.serviceLifeYears)}</td>
                <td className="px-3 py-2">{formatYear(item.lastIssuedYear)}</td>
                <td className="px-3 py-2 font-medium">
                  {formatQuantity(item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AllocationIssueTab() {
  const currentYear = new Date().getFullYear();
  const [militarySearch, setMilitarySearch] = useState("");
  const deferredMilitarySearch = useDeferredValue(militarySearch);
  const [selectedMilitaryId, setSelectedMilitaryId] = useState("");
  const [selectedModeId, setSelectedModeId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [issueYear, setIssueYear] = useState(String(currentYear));
  const [receiverName, setReceiverName] = useState("");
  const [note, setNote] = useState("");
  const [quantitiesByCategoryId, setQuantitiesByCategoryId] = useState({});
  const [variantsByCategoryId, setVariantsByCategoryId] = useState({});
  const [recentVoucher, setRecentVoucher] = useState(null);

  const militaryQueryArg = useMemo(
    () => ({
      search: deferredMilitarySearch.trim() || undefined,
      page: 1,
      limit: 50,
      sortBy: "fullname",
      sortDir: "asc",
    }),
    [deferredMilitarySearch],
  );

  const { data: militariesData, isFetching: isFetchingMilitaries } =
    useGetMilitariesQuery(militaryQueryArg, {
      refetchOnMountOrArgChange: true,
    });
  const { data: warehouseData } = useGetCategoryWarehousesQuery();

  const parsedIssueYear = Number.parseInt(issueYear, 10);
  const {
    data: applicableModesData,
    isFetching: isFetchingApplicableModes,
    refetch: refetchApplicableModes,
  } = useGetApplicableAllocationModesQuery(
    {
      militaryId: selectedMilitaryId || undefined,
      issueYear: Number.isInteger(parsedIssueYear) ? parsedIssueYear : undefined,
    },
    {
      skip: !selectedMilitaryId || !Number.isInteger(parsedIssueYear),
      refetchOnMountOrArgChange: true,
    },
  );

  const {
    data: eligibilityData,
    isFetching: isFetchingEligibility,
    refetch: refetchEligibility,
  } = useGetAllocationModeEligibilityQuery(
    {
      modeId: selectedModeId,
      militaryId: selectedMilitaryId || undefined,
      issueYear: Number.isInteger(parsedIssueYear) ? parsedIssueYear : undefined,
      warehouseId: selectedWarehouseId || undefined,
    },
    {
      skip:
        !selectedModeId ||
        !selectedMilitaryId ||
        !selectedWarehouseId ||
        !Number.isInteger(parsedIssueYear),
      refetchOnMountOrArgChange: true,
    },
  );

  const [createIssueVoucher, { isLoading: isCreatingVoucher }] =
    useCreateAllocationModeIssueVoucherMutation();

  const militaries = militariesData?.militaries || [];
  const warehouses = warehouseData?.warehouses || [];
  const applicableModes = applicableModesData?.modes || [];
  const eligibilityRows = eligibilityData?.rows || [];
  const selectedMilitary =
    applicableModesData?.military ||
    militaries.find((military) => String(military.id) === String(selectedMilitaryId)) ||
    null;

  const applicableCount = applicableModes.filter(
    (mode) => mode.applicability?.applicable,
  ).length;

  const handleModeChange = (nextModeId) => {
    setSelectedModeId(nextModeId);
    setQuantitiesByCategoryId({});
    setVariantsByCategoryId({});
    setRecentVoucher(null);
  };

  const handleQuantityChange = (categoryId, value) => {
    setRecentVoucher(null);
    setQuantitiesByCategoryId((current) => ({
      ...current,
      [categoryId]: value,
    }));
  };

  const handleVariantChange = (categoryId, value) => {
    setRecentVoucher(null);
    setVariantsByCategoryId((current) => ({
      ...current,
      [categoryId]: value,
    }));
  };

  const handleCreateVoucher = async (event) => {
    event.preventDefault();

    if (!selectedMilitaryId) {
      toast.error("Vui lòng chọn quân nhân.");
      return;
    }

    if (!selectedModeId) {
      toast.error("Vui lòng chọn chế độ cấp phát.");
      return;
    }

    if (!selectedWarehouseId) {
      toast.error("Vui lòng chọn kho xuất.");
      return;
    }

    if (!Number.isInteger(parsedIssueYear)) {
      toast.error("Năm cấp phát không hợp lệ.");
      return;
    }

    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập tên người nhận hàng.");
      return;
    }

    try {
      const items = eligibilityRows.map((row) => {
        const variantValue =
          variantsByCategoryId[row.categoryId] ||
          (row.availableVariants?.[0]
            ? `${row.availableVariants[0].versionId}:${row.availableVariants[0].colorId}`
            : "");

        return {
          categoryId: Number(row.categoryId),
          quantity: Math.max(
            0,
            Number.parseInt(
              quantitiesByCategoryId[row.categoryId] ??
                String(row.eligible ? row.remainingQuantity ?? row.quantity : 0),
              10,
            ) || 0,
          ),
          ...(variantValue
            ? {
                versionId: Number(String(variantValue).split(":")[0]),
                colorId: Number(String(variantValue).split(":")[1]),
              }
            : {}),
        };
      });

      const result = await createIssueVoucher({
        modeId: selectedModeId,
        militaryId: selectedMilitaryId,
        warehouseId: Number(selectedWarehouseId),
        issueYear: parsedIssueYear,
        receiverName: receiverName.trim(),
        note: note.trim() || undefined,
        items,
      }).unwrap();

      const createdVoucher = result?.data?.voucher || null;
      setRecentVoucher(createdVoucher);
      setQuantitiesByCategoryId({});
      setVariantsByCategoryId({});
      setReceiverName(selectedMilitary?.fullname || "");
      setNote("");
      toast.success("Đã tạo phiếu xuất kho cấp phát.");
      refetchEligibility();
      refetchApplicableModes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tạo phiếu xuất kho."));
    }
  };

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary"
            >
              Cấp phát theo chế độ mới
            </Badge>
            <h2 className="text-lg font-semibold sm:text-xl">Cấp phát quân trang</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Chọn quân nhân, hệ thống sẽ gợi ý các chế độ phù hợp. Từ đó đối chiếu
              niên hạn, năm cấp phát gần nhất và năm thực hiện cấp phát để xác định
              quân trang đủ điều kiện xuất kho.
            </p>
          </div>

          <AllocationVoucherPrintDialog
            voucher={recentVoucher}
            triggerLabel="Mẫu in / In trực tiếp"
            triggerVariant="outline"
          />
        </div>
      </Card>

      <form onSubmit={handleCreateVoucher} className="grid gap-5 2xl:grid-cols-[1.05fr_1.35fr]">
        <Card className="space-y-4 rounded-2xl p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h3 className="font-semibold">Chọn quân nhân và chế độ</h3>
            <p className="text-sm text-muted-foreground">
              Chế độ cấp phát sẽ tự lọc theo loại quân nhân, quy tắc và danh sách
              quân nhân chỉ định.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="allocation-military-search" className="text-sm font-medium">
              Tìm quân nhân
            </label>
            <Input
              id="allocation-military-search"
              value={militarySearch}
              onChange={(event) => setMilitarySearch(event.target.value)}
              placeholder="Tìm theo tên hoặc mã quân nhân"
              className="h-11 rounded-xl"
            />
            <select
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm shadow-sm"
              value={selectedMilitaryId}
              onChange={(event) => {
                const nextMilitaryId = event.target.value;
                const nextMilitary = militaries.find(
                  (military) => String(military.id) === String(nextMilitaryId),
                );

                setSelectedMilitaryId(nextMilitaryId);
                setSelectedModeId("");
                setSelectedWarehouseId("");
                setReceiverName(nextMilitary?.fullname || "");
                setQuantitiesByCategoryId({});
                setVariantsByCategoryId({});
                setRecentVoucher(null);
              }}
            >
              <option value="">Chọn quân nhân</option>
              {militaries.map((military) => (
                <option key={military.id} value={military.id}>
                  {military.fullname} - {military.militaryCode || "-"}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {isFetchingMilitaries
                ? "Đang tải danh sách quân nhân..."
                : `${militaries.length} gợi ý`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="allocation-issue-year" className="text-sm font-medium">
                Năm thực hiện cấp phát
              </label>
              <Input
                id="allocation-issue-year"
                type="number"
                min={1900}
                max={3000}
                value={issueYear}
                onChange={(event) => {
                  setIssueYear(event.target.value);
                  setSelectedModeId("");
                  setQuantitiesByCategoryId({});
                  setRecentVoucher(null);
                }}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="allocation-warehouse" className="text-sm font-medium">
                Kho xuất
              </label>
              <select
                id="allocation-warehouse"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm shadow-sm"
                value={selectedWarehouseId}
                onChange={(event) => {
                  setSelectedWarehouseId(event.target.value);
                  setRecentVoucher(null);
                }}
              >
                <option value="">Chọn kho xuất</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedMilitary ? (
            <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
              <MilitarySummary military={selectedMilitary} />
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="allocation-mode" className="text-sm font-medium">
                Chế độ cấp phát phù hợp
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  refetchApplicableModes();
                  if (selectedModeId) refetchEligibility();
                }}
                disabled={isFetchingApplicableModes || isFetchingEligibility}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Tải lại
              </Button>
            </div>

            <select
              id="allocation-mode"
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm shadow-sm"
              value={selectedModeId}
              onChange={(event) => handleModeChange(event.target.value)}
              disabled={!selectedMilitaryId || !Number.isInteger(parsedIssueYear)}
            >
              <option value="">Chọn chế độ cấp phát</option>
              {applicableModes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name} - {mode.applicability?.applicable ? "Phù hợp" : "Không phù hợp"}
                </option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground">
              {isFetchingApplicableModes
                ? "Đang xác định các chế độ phù hợp..."
                : selectedMilitaryId
                  ? `${applicableCount}/${applicableModes.length} chế độ đang phù hợp với quân nhân này`
                  : "Chọn quân nhân để lấy danh sách chế độ phù hợp"}
            </p>
          </div>

          <div className="space-y-3">
            {applicableModes.map((mode) => {
              const applicable = mode.applicability?.applicable;
              return (
                <div
                  key={mode.id}
                  className={`rounded-2xl border p-4 text-sm shadow-sm transition-colors ${
                    String(selectedModeId) === String(mode.id)
                      ? "border-primary/30 bg-primary/[0.06]"
                      : applicable
                        ? "border-border/70 bg-background"
                        : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{mode.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatModeScope(mode.scope)} • {mode.type?.name || mode.type?.code || "-"}
                      </div>
                    </div>
                    <Badge variant={applicable ? "default" : "secondary"}>
                      {applicable ? "Phù hợp" : "Không phù hợp"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {mode.applicability?.reason || "Chưa có đánh giá."}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-4 rounded-2xl p-4 shadow-sm sm:p-5">
            <div className="space-y-1">
              <h3 className="font-semibold">Điều kiện cấp phát theo quân trang</h3>
              <p className="text-sm text-muted-foreground">
                Hệ thống dựa trên niên hạn, năm cấp phát gần nhất và năm thực hiện
                cấp phát để đánh dấu từng quân trang đã đủ điều kiện hay chưa.
              </p>
            </div>

            {selectedModeId && selectedWarehouseId ? (
              <div className="overflow-auto rounded-2xl border border-border/70">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2">Quân trang</th>
                      <th className="px-3 py-2">Phiên bản / màu sắc</th>
                      <th className="px-3 py-2">Định mức chế độ</th>
                      <th className="px-3 py-2">Đã cấp trong năm</th>
                      <th className="px-3 py-2">Còn được cấp</th>
                      <th className="px-3 py-2">Niên hạn</th>
                      <th className="px-3 py-2">Năm gần nhất</th>
                      <th className="px-3 py-2">Đủ điều kiện</th>
                      <th className="px-3 py-2">Tồn kho</th>
                      <th className="px-3 py-2">Số lượng cấp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibilityRows.map((row) => {
                      const inputValue =
                        quantitiesByCategoryId[row.categoryId] ??
                        String(
                          row.eligible ? row.remainingQuantity ?? row.quantity : 0,
                        );

                      const variantValue =
                        variantsByCategoryId[row.categoryId] ||
                        (row.availableVariants?.[0]
                          ? `${row.availableVariants[0].versionId}:${row.availableVariants[0].colorId}`
                          : "");

                      return (
                        <tr key={row.categoryId} className="border-t align-top">
                          <td className="px-3 py-2">
                            <div className="font-medium">{row.category?.name || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.category?.unitOfMeasure?.name || "-"}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-muted-foreground">
                              {row.reason}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              className="h-10 min-w-[190px] rounded-xl border bg-background px-3 text-sm shadow-sm"
                              value={variantValue}
                              disabled={!row.eligible || !(row.availableVariants || []).length}
                              onChange={(event) =>
                                handleVariantChange(row.categoryId, event.target.value)
                              }
                            >
                              {!row.availableVariants?.length ? (
                                <option value="">Không có tồn kho khả dụng</option>
                              ) : null}
                              {(row.availableVariants || []).map((variant) => (
                                <option
                                  key={`${row.categoryId}-${variant.versionId}-${variant.colorId}`}
                                  value={`${variant.versionId}:${variant.colorId}`}
                                >
                                  {[
                                    variant.versionName && variant.versionName !== "None"
                                      ? variant.versionName
                                      : null,
                                    variant.colorName && variant.colorName !== "None"
                                      ? variant.colorName
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" / ") || "Mặc định"}{" "}
                                  - tồn {formatQuantity(variant.quantity)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {formatQuantity(row.modeQuantity ?? row.quantity)}
                          </td>
                          <td className="px-3 py-2">
                            {formatQuantity(row.issuedQuantityInYear)}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {formatQuantity(row.remainingQuantity ?? row.quantity)}
                          </td>
                          <td className="px-3 py-2">{formatYear(row.serviceLifeYears)}</td>
                          <td className="px-3 py-2">{formatYear(row.lastIssuedYear)}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.eligible ? "default" : "secondary"}>
                              {row.eligible ? "Đủ điều kiện" : "Chưa đủ điều kiện"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">{formatQuantity(row.warehouseStock)}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              max={row.remainingQuantity ?? row.quantity}
                              value={inputValue}
                              disabled={!row.eligible}
                              onChange={(event) =>
                                handleQuantityChange(row.categoryId, event.target.value)
                              }
                              className="h-10 min-w-[120px] rounded-xl"
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {!eligibilityRows.length && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          {isFetchingEligibility
                            ? "Đang kiểm tra điều kiện cấp phát..."
                            : "Chọn đủ quân nhân, chế độ và kho để xem danh sách quân trang."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Chọn quân nhân, chế độ cấp phát và kho xuất để hệ thống đối chiếu
                niên hạn cho từng quân trang.
              </div>
            )}

            <div className="grid gap-3 xl:grid-cols-[0.8fr_1fr_auto] xl:items-end">
              <div className="space-y-2">
                <label htmlFor="allocation-receiver" className="text-sm font-medium">
                  Người nhận hàng
                </label>
                <Input
                  id="allocation-receiver"
                  value={receiverName}
                  onChange={(event) => {
                    setReceiverName(event.target.value);
                    setRecentVoucher(null);
                  }}
                  placeholder="Nhập họ và tên người nhận"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="allocation-note" className="text-sm font-medium">
                  Ghi chú phiếu xuất kho
                </label>
                <Textarea
                  id="allocation-note"
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    setRecentVoucher(null);
                  }}
                  placeholder="Nhập ghi chú nếu cần"
                  className="min-h-[96px] rounded-2xl"
                />
              </div>

              {recentVoucher ? (
                <AllocationVoucherPrintDialog
                  voucher={recentVoucher}
                  triggerLabel="In phiếu vừa tạo"
                  triggerClassName="h-11 rounded-xl px-6"
                />
              ) : (
                <Button
                  type="submit"
                  disabled={
                    isCreatingVoucher ||
                    !selectedMilitaryId ||
                    !selectedModeId ||
                    !selectedWarehouseId ||
                    !eligibilityRows.length
                  }
                  className="h-11 rounded-xl px-6"
                >
                  {isCreatingVoucher ? "Đang tạo phiếu..." : "Tạo phiếu xuất kho"}
                </Button>
              )}
            </div>
          </Card>

          <VoucherPreview
            voucher={recentVoucher}
          />
        </div>
      </form>
    </div>
  );
}
