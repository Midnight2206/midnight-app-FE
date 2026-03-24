import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpDown, FileText, PencilLine, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import AllocationVoucherPrintDialog from "@/pages/Inventory/components/AllocationVoucherPrintDialog";
import DataPagination from "@/components/DataPagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteAllocationModeIssueVoucherMutation,
  useGetAllocationModeEligibilityQuery,
  useGetAllocationModeIssueVoucherDetailQuery,
  useGetAllocationModeIssueVouchersQuery,
  useUpdateAllocationModeIssueVoucherMutation,
} from "@/features/inventory/inventoryApi";
import { getApiErrorMessage } from "@/utils/apiError";

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

function formatQuantity(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function getVoucherPurposeLabel(purpose) {
  return purpose === "OTHER" ? "Xuất khác" : "Cấp phát";
}

function buildVoucherEditState(voucher) {
  const quantities = {};
  const variants = {};

  (voucher?.items || []).forEach((item) => {
    quantities[item.category?.id || item.categoryId] = String(item.quantity || 0);
    if (item.versionId && item.colorId) {
      variants[item.category?.id || item.categoryId] = `${item.versionId}:${item.colorId}`;
    }
  });

  return { quantities, variants };
}

function buildVoucherSubjectLabel(voucher) {
  if (voucher?.mode?.name && voucher?.military?.fullname) {
    return `${voucher.military.fullname} • ${voucher.mode.name}`;
  }

  if (voucher?.mode?.name) return voucher.mode.name;
  if (voucher?.military?.fullname) return voucher.military.fullname;
  if (voucher?.purpose === "OTHER") return "Xuất kho ngoài chế độ";
  return "-";
}

function IssueVoucherDetailPanel({ voucher, onDeleted }) {
  const isOtherVoucher = voucher?.purpose === "OTHER";
  const [isEditing, setIsEditing] = useState(false);
  const initialEditState = useMemo(() => buildVoucherEditState(voucher), [voucher]);
  const [receiverName, setReceiverName] = useState(
    voucher?.receiverName || voucher?.military?.fullname || "",
  );
  const [reason, setReason] = useState(voucher?.reason || "");
  const [note, setNote] = useState(voucher?.note || "");
  const [quantitiesByCategoryId, setQuantitiesByCategoryId] = useState(
    initialEditState.quantities,
  );
  const [variantsByCategoryId, setVariantsByCategoryId] = useState(
    initialEditState.variants,
  );
  const eligibilityQueryArg = useMemo(
    () => ({
      modeId: voucher?.mode?.id,
      militaryId: voucher?.military?.id,
      issueYear: voucher?.issuedYear,
      warehouseId: voucher?.warehouse?.id,
      excludeVoucherId: voucher?.id,
    }),
    [
      voucher?.id,
      voucher?.issuedYear,
      voucher?.military?.id,
      voucher?.mode?.id,
      voucher?.warehouse?.id,
    ],
  );

  const { data: eligibilityData, isFetching: isFetchingEligibility } =
    useGetAllocationModeEligibilityQuery(
      eligibilityQueryArg,
      {
        skip:
          !isEditing ||
          !voucher?.mode?.id ||
          !voucher?.military?.id ||
          !voucher?.warehouse?.id ||
          !voucher?.issuedYear,
      },
    );
  const [updateIssueVoucher, { isLoading: isUpdatingVoucher }] =
    useUpdateAllocationModeIssueVoucherMutation();
  const [deleteIssueVoucher, { isLoading: isDeletingVoucher }] =
    useDeleteAllocationModeIssueVoucherMutation();

  const eligibilityRows = eligibilityData?.rows || [];

  const resetEditState = () => {
    const nextState = buildVoucherEditState(voucher);
    setReceiverName(voucher?.receiverName || voucher?.military?.fullname || "");
    setReason(voucher?.reason || "");
    setNote(voucher?.note || "");
    setQuantitiesByCategoryId(nextState.quantities);
    setVariantsByCategoryId(nextState.variants);
  };

  const handleSaveVoucher = async () => {
    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập tên người nhận hàng.");
      return;
    }

    if (isOtherVoucher && !reason.trim()) {
      toast.error("Vui lòng nhập lý do xuất kho.");
      return;
    }

    if (isOtherVoucher) {
      try {
        await updateIssueVoucher({
          voucherId: voucher.id,
          receiverName: receiverName.trim(),
          reason: reason.trim(),
          note: note.trim() || undefined,
        }).unwrap();

        toast.success("Đã cập nhật phiếu xuất kho.");
        setIsEditing(false);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Không thể cập nhật phiếu xuất kho."));
      }
      return;
    }

    if (!eligibilityRows.length) {
      toast.error("Chưa tải được danh sách quân trang tiêu chuẩn để cập nhật phiếu.");
      return;
    }

    try {
      const items = eligibilityRows.map((row) => {
        const variantValue =
          variantsByCategoryId[row.categoryId] ??
          (row.availableVariants?.[0]
            ? `${row.availableVariants[0].versionId}:${row.availableVariants[0].colorId}`
            : "");

        return {
          categoryId: Number(row.categoryId),
          quantity: Math.max(
            0,
            Number.parseInt(
              quantitiesByCategoryId[row.categoryId] ??
                initialEditState.quantities[row.categoryId] ??
                "0",
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

      await updateIssueVoucher({
        voucherId: voucher.id,
        receiverName: receiverName.trim(),
        reason: isOtherVoucher ? reason.trim() : undefined,
        note: note.trim() || undefined,
        items,
      }).unwrap();

      toast.success("Đã cập nhật phiếu xuất kho.");
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật phiếu xuất kho."));
    }
  };

  const handleDeleteVoucher = async () => {
    try {
      await deleteIssueVoucher({ voucherId: voucher.id }).unwrap();
      toast.success("Đã xóa phiếu xuất kho.");
      onDeleted(voucher.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa phiếu xuất kho."));
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold">Chi tiết phiếu xuất kho</h3>
          <p className="text-sm text-muted-foreground">
            Xem lại, chỉnh sửa người nhận, bổ sung quân trang trong tiêu chuẩn
            hoặc xóa phiếu và hệ thống sẽ tự cân lại tồn kho.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AllocationVoucherPrintDialog
            voucher={voucher}
            triggerLabel="Xem mẫu in / In phiếu"
          />
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetEditState();
                  setIsEditing(false);
                }}
                disabled={isUpdatingVoucher}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSaveVoucher}
                disabled={isUpdatingVoucher || isFetchingEligibility}
              >
                {isUpdatingVoucher ? "Đang lưu..." : "Lưu điều chỉnh"}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              Điều chỉnh phiếu
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" type="button" />}>
              Xóa phiếu
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa phiếu xuất kho?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tồn kho sẽ được hoàn lại theo đúng các mặt hàng đã xuất trong phiếu này.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingVoucher}>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteVoucher}
                  disabled={isDeletingVoucher}
                >
                  {isDeletingVoucher ? "Đang xóa..." : "Xóa phiếu"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground xl:grid-cols-2">
        <div>
          <div className="font-medium text-foreground">
            {voucher.voucherNo || voucher.id}
          </div>
          <div>Ngày cấp phát: {formatDateTime(voucher.issuedAt)}</div>
          <div>Kho xuất: {voucher.warehouse?.name || "-"}</div>
          <div>Loại phiếu: {getVoucherPurposeLabel(voucher.purpose)}</div>
          {isEditing ? (
            <div className="mt-3 space-y-2">
              <label className="text-sm font-medium text-foreground">Người nhận</label>
              <Input
                value={receiverName}
                onChange={(event) => setReceiverName(event.target.value)}
                className="h-10 rounded-xl bg-background"
              />
            </div>
          ) : (
            <div>Người nhận: {voucher.receiverName || "-"}</div>
          )}
        </div>
        <div>
          <div>Quân nhân: {voucher.military?.fullname || "-"}</div>
          <div>Chế độ: {voucher.mode?.name || (isOtherVoucher ? "Xuất kho ngoài chế độ" : "-")}</div>
          <div>Đơn vị: {voucher.unit?.name || "-"}</div>
          {isOtherVoucher ? (
            isEditing ? (
              <div className="mt-3 space-y-2">
                <label className="text-sm font-medium text-foreground">Lý do xuất kho</label>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="min-h-[84px] rounded-2xl bg-background"
                />
              </div>
            ) : (
              <div>Lý do xuất kho: {voucher.reason || "-"}</div>
            )
          ) : null}
          {isEditing ? (
            <div className="mt-3 space-y-2">
              <label className="text-sm font-medium text-foreground">Ghi chú</label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-[84px] rounded-2xl bg-background"
              />
            </div>
          ) : (
            <div>Ghi chú: {voucher.note || "-"}</div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="overflow-auto rounded-2xl border border-border/70">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2">Quân trang</th>
                <th className="px-3 py-2">Phiên bản / màu sắc</th>
                <th className="px-3 py-2">Định mức</th>
                <th className="px-3 py-2">Đã cấp năm nay</th>
                <th className="px-3 py-2">Còn được cấp</th>
                <th className="px-3 py-2">Tồn kho</th>
                <th className="px-3 py-2">Số lượng sửa</th>
              </tr>
            </thead>
            <tbody>
              {eligibilityRows.map((row) => {
                const hasExistingItem =
                  initialEditState.quantities[row.categoryId] !== undefined;
                const rowEditable = row.eligible || hasExistingItem;
                const maxEditableQuantity = Math.max(
                  Number(row.remainingQuantity || 0),
                  Number(initialEditState.quantities[row.categoryId] || 0),
                );
                const inputValue =
                  quantitiesByCategoryId[row.categoryId] ??
                  initialEditState.quantities[row.categoryId] ??
                  "0";
                const variantValue =
                  variantsByCategoryId[row.categoryId] ??
                  initialEditState.variants[row.categoryId] ??
                  (row.availableVariants?.[0]
                    ? `${row.availableVariants[0].versionId}:${row.availableVariants[0].colorId}`
                    : "");

                return (
                  <tr key={row.categoryId} className="border-t align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.category?.name || "-"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{row.reason}</div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="h-10 min-w-[200px] rounded-xl border bg-background px-3 text-sm shadow-sm"
                        value={variantValue}
                        disabled={!rowEditable || !(row.availableVariants || []).length}
                        onChange={(event) =>
                          setVariantsByCategoryId((current) => ({
                            ...current,
                            [row.categoryId]: event.target.value,
                          }))
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
                    <td className="px-3 py-2">{formatQuantity(row.modeQuantity)}</td>
                    <td className="px-3 py-2">{formatQuantity(row.issuedQuantityInYear)}</td>
                    <td className="px-3 py-2 font-medium">
                      {formatQuantity(row.remainingQuantity)}
                    </td>
                    <td className="px-3 py-2">{formatQuantity(row.warehouseStock)}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={maxEditableQuantity}
                        value={inputValue}
                        disabled={!rowEditable}
                        onChange={(event) =>
                          setQuantitiesByCategoryId((current) => ({
                            ...current,
                            [row.categoryId]: event.target.value,
                          }))
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
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    {isFetchingEligibility
                      ? "Đang tải quân trang tiêu chuẩn của phiếu..."
                      : "Không có dữ liệu tiêu chuẩn để chỉnh sửa phiếu này."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto rounded-2xl border border-border/70">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2">Quân trang</th>
                <th className="px-3 py-2">Số lượng</th>
                <th className="px-3 py-2">Niên hạn</th>
                <th className="px-3 py-2">Năm gần nhất trước đó</th>
                <th className="px-3 py-2">Ghi nhận</th>
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
                  <td className="px-3 py-2 font-medium">
                    {formatQuantity(item.quantity)}
                  </td>
                  <td className="px-3 py-2">{item.serviceLifeYears || "-"}</td>
                  <td className="px-3 py-2">{item.lastIssuedYear || "-"}</td>
                  <td className="px-3 py-2">
                    {item.wasDue
                      ? "Đã đến niên hạn"
                      : item.nextEligibleYear
                        ? `Chưa đến niên hạn, từ ${item.nextEligibleYear}`
                        : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function IssueHistoryTab() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);

  const queryArg = useMemo(
    () => ({
      search: deferredSearch.trim() || undefined,
      sortBy: "issuedAt",
      sortDir,
      page,
      limit: 12,
    }),
    [deferredSearch, page, sortDir],
  );

  const {
    data: vouchersData,
    isLoading: isLoadingVouchers,
    isFetching: isFetchingVouchers,
  } = useGetAllocationModeIssueVouchersQuery(queryArg, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteIssueVoucher] = useDeleteAllocationModeIssueVoucherMutation();

  const voucherRows = vouchersData?.vouchers || [];
  const pagination = vouchersData?.pagination || {
    page: 1,
    totalPages: 0,
    total: 0,
  };

  const { data: voucherDetailData, isFetching: isFetchingVoucherDetail } =
    useGetAllocationModeIssueVoucherDetailQuery(
      { voucherId: selectedVoucherId },
      {
        skip: !selectedVoucherId,
        refetchOnMountOrArgChange: true,
      },
    );

  const detailVoucher = voucherDetailData?.voucher || null;
  const activeFilterCount = [Boolean(search.trim()), sortDir !== "desc"].filter(Boolean).length;

  return (
    <>
      <Dialog
        open={isVoucherDialogOpen}
        onOpenChange={(open) => {
          setIsVoucherDialogOpen(open);
          if (!open) {
            setSelectedVoucherId("");
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-[95vw] overflow-hidden sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu xuất kho</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto pr-1">
            {detailVoucher ? (
              <IssueVoucherDetailPanel
                key={detailVoucher.id}
                voucher={detailVoucher}
                onDeleted={() => {
                  setSelectedVoucherId("");
                  setIsVoucherDialogOpen(false);
                }}
              />
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                {isFetchingVoucherDetail
                  ? "Đang tải chi tiết phiếu..."
                  : "Không tải được chi tiết phiếu."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden rounded-3xl border border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] p-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.55)] sm:p-5">
        <div className="space-y-4 rounded-[1.4rem] border border-border/60 bg-background/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary"
              >
                Tra cứu và xem lại phiếu
              </Badge>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                  Lịch sử cấp phát quân trang
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Bảng lịch sử được tối ưu để tra nhanh theo người nhận, loại phiếu,
                  năm xét và thao tác ngay trên từng dòng mà không phải cuộn xuống dưới.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[330px]">
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Tổng phiếu
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {pagination.total || 0}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Trang hiện tại
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {pagination.page || 1}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Bộ lọc
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {activeFilterCount}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.35rem] border border-border/60 bg-muted/15 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_250px_auto]">
            <div className="space-y-2">
              <label htmlFor="voucher-search" className="text-sm font-medium text-foreground">
                Tìm kiếm nhanh
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="voucher-search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                    setSelectedVoucherId("");
                    setIsVoucherDialogOpen(false);
                  }}
                  placeholder="Tìm theo số phiếu, người nhận hoặc đối tượng"
                  className="h-11 rounded-2xl border-border/70 bg-background pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tìm theo số phiếu, tên người nhận, tên quân nhân, mã quân nhân hoặc tên chế độ.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="voucher-sort" className="text-sm font-medium text-foreground">
                Sắp xếp theo ngày
              </label>
              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="voucher-sort"
                  className="h-11 w-full rounded-2xl border border-border/70 bg-background px-3 pl-10 text-sm shadow-sm"
                  value={sortDir}
                  onChange={(event) => {
                    setSortDir(event.target.value);
                    setPage(1);
                    setSelectedVoucherId("");
                    setIsVoucherDialogOpen(false);
                  }}
                >
                  <option value="desc">Mới nhất trước</option>
                  <option value="asc">Cũ nhất trước</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl border-dashed sm:w-auto"
                disabled={!search.trim() && sortDir === "desc"}
                onClick={() => {
                  setSearch("");
                  setSortDir("desc");
                  setPage(1);
                  setSelectedVoucherId("");
                  setIsVoucherDialogOpen(false);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-background shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-2 border-b border-border/60 bg-muted/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{pagination.total || 0}</span>{" "}
              phiếu phù hợp với bộ lọc hiện tại.
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <div className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                <span className="font-medium text-foreground">Sửa</span> để mở dialog
              </div>
              <div className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                <span className="font-medium text-foreground">In</span> trực tiếp trên dòng
              </div>
              <div className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                <span className="font-medium text-foreground">Xóa</span> có xác nhận
              </div>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[1220px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted/65 text-left backdrop-blur">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Số phiếu
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Loại
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Người nhận
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Tiêu chuẩn / đối tượng
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Kho xuất
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Ngày cấp
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Năm xét
                </th>
                <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Số dòng
                </th>
                <th className="sticky right-0 bg-muted/80 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {voucherRows.map((voucher) => (
                <tr
                  key={voucher.id}
                  className="border-t border-border/60 align-top transition-colors odd:bg-background even:bg-muted/[0.14] hover:bg-primary/[0.045]"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground">
                          {voucher.voucherNo || voucher.id}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Tạo bởi{" "}
                          {voucher.createdBy?.displayName || voucher.createdBy?.username || "-"}
                        </div>
                        {voucher.purpose === "OTHER" && voucher.reason ? (
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            Lý do: {voucher.reason}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge
                      variant={voucher.purpose === "OTHER" ? "outline" : "secondary"}
                      className={
                        voucher.purpose === "OTHER"
                          ? "border-amber-300/70 bg-amber-50 text-amber-700"
                          : "bg-primary/10 text-primary"
                      }
                    >
                      {getVoucherPurposeLabel(voucher.purpose)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="font-medium text-foreground">
                      {voucher.receiverName || "-"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {voucher.purpose === "OTHER"
                        ? "Người nhận của phiếu xuất khác"
                        : "Người nhận của phiếu cấp phát"}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="font-medium text-foreground">
                      {buildVoucherSubjectLabel(voucher)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {voucher.unit?.name || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="font-medium text-foreground">
                      {voucher.warehouse?.name || "-"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Kho xuất của phiếu
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="font-medium text-foreground">
                      {voucher.voucherNo || voucher.id}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(voucher.issuedAt)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Thời điểm cấp thực tế
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge variant="outline" className="bg-background/90">
                      {voucher.issuedYear || "-"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge variant="secondary" className="bg-muted text-foreground">
                      {voucher.items?.length || 0} dòng
                    </Badge>
                  </td>
                  <td className="sticky right-0 bg-inherit px-4 py-3.5">
                    <div className="flex flex-nowrap items-center justify-end gap-1.5 rounded-2xl border border-border/60 bg-background/95 p-1.5 shadow-sm backdrop-blur">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="shrink-0"
                        onClick={() => {
                          setSelectedVoucherId(voucher.id);
                          setIsVoucherDialogOpen(true);
                        }}
                      >
                        <PencilLine className="size-3.5" />
                        Sửa
                      </Button>
                      <AllocationVoucherPrintDialog
                        voucher={voucher}
                        triggerLabel="In"
                        triggerVariant="outline"
                        triggerClassName="h-7 shrink-0 rounded-lg px-2.5 text-xs"
                      />
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button variant="destructive" type="button" size="xs" />
                          }
                        >
                          <Trash2 className="size-3.5" />
                          Xóa
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa phiếu xuất kho?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tồn kho sẽ được hoàn lại theo đúng các mặt hàng đã xuất trong phiếu này.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  await deleteIssueVoucher({ voucherId: voucher.id }).unwrap();
                                  toast.success("Đã xóa phiếu xuất kho.");
                                  if (selectedVoucherId === voucher.id) {
                                    setSelectedVoucherId("");
                                    setIsVoucherDialogOpen(false);
                                  }
                                } catch (error) {
                                  toast.error(
                                    getApiErrorMessage(
                                      error,
                                      "Không thể xóa phiếu xuất kho.",
                                    ),
                                  );
                                }
                              }}
                            >
                              Xóa phiếu
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>

          {!voucherRows.length && (
            <div className="border-t border-dashed p-8 text-center text-sm text-muted-foreground">
              {isLoadingVouchers || isFetchingVouchers
                ? "Đang tải lịch sử cấp phát..."
                : "Chưa có phiếu cấp phát nào theo bộ lọc hiện tại."}
            </div>
          )}
        </div>

        <DataPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(nextPage) => setPage(nextPage)}
        />
      </Card>
    </>
  );
}
