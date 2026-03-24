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
  useGetCategoryWarehousesQuery,
  useGetWarehouseCategoryItemsQuery,
} from "@/features/inventory/inventoryApi";
import { getApiErrorMessage } from "@/utils/apiError";

function formatQuantity(value) {
  return Number(value || 0).toLocaleString("vi-VN");
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

function buildVariantKey(item) {
  return `${item?.category?.id || item?.categoryId}:${item?.version?.id || item?.versionId}:${item?.color?.id || item?.colorId}`;
}

function RecentVoucherPreview({ voucher }) {
  if (!voucher) return null;

  return (
    <Card className="space-y-4 rounded-2xl border-primary/15 bg-gradient-to-br from-primary/[0.08] to-background p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <Badge className="bg-primary/90 text-primary-foreground">
            Phiếu xuất khác vừa tạo
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

      <div className="rounded-xl border border-border/70 bg-background/80 p-3 text-sm">
        <div>
          <span className="font-medium">Lý do xuất kho:</span>{" "}
          {voucher.reason || "-"}
        </div>
        <div className="mt-1">
          <span className="font-medium">Ghi chú:</span> {voucher.note || "-"}
        </div>
      </div>
    </Card>
  );
}

export default function OtherIssueTab() {
  const currentYear = new Date().getFullYear();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const deferredItemSearch = useDeferredValue(itemSearch);
  const [issueYear, setIssueYear] = useState(String(currentYear));
  const [receiverName, setReceiverName] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [selectedEntriesByCategoryId, setSelectedEntriesByCategoryId] = useState({});
  const [recentVoucher, setRecentVoucher] = useState(null);

  const { data: warehouseData } = useGetCategoryWarehousesQuery();
  const warehouses = warehouseData?.warehouses || [];
  const parsedIssueYear = Number.parseInt(issueYear, 10);

  const warehouseItemsQueryArg = useMemo(
    () => ({
      warehouseId: selectedWarehouseId || undefined,
      search: deferredItemSearch.trim() || undefined,
      page: 1,
      limit: 200,
    }),
    [deferredItemSearch, selectedWarehouseId],
  );

  const {
    data: warehouseItemsData,
    isFetching: isFetchingWarehouseItems,
    refetch: refetchWarehouseItems,
  } = useGetWarehouseCategoryItemsQuery(warehouseItemsQueryArg, {
    skip: !selectedWarehouseId,
    refetchOnMountOrArgChange: true,
  });

  const [createIssueVoucher, { isLoading: isCreatingVoucher }] =
    useCreateAllocationModeIssueVoucherMutation();

  const warehouseItems = warehouseItemsData?.items || [];
  const selectedEntries = Object.values(selectedEntriesByCategoryId);

  const handleToggleEntry = (item) => {
    const categoryId = item?.category?.id;
    if (!categoryId) return;

    const selectedKey = buildVariantKey(
      selectedEntriesByCategoryId[categoryId] || {},
    );
    const nextKey = buildVariantKey(item);

    setRecentVoucher(null);
    setSelectedEntriesByCategoryId((current) => {
      if (selectedKey === nextKey) {
        const next = { ...current };
        delete next[categoryId];
        return next;
      }

      return {
        ...current,
        [categoryId]: {
          categoryId,
          categoryName: item.category?.name || "-",
          versionId: item.version?.id || null,
          versionName: item.version?.name || null,
          colorId: item.color?.id || null,
          colorName: item.color?.name || null,
          unitOfMeasureName: item.category?.unitOfMeasure?.name || "-",
          stockQuantity: Number(item.quantity || 0),
          quantity: Math.min(
            Math.max(1, Number(current[categoryId]?.quantity || 1)),
            Math.max(1, Number(item.quantity || 1)),
          ),
        },
      };
    });
  };

  const handleSelectedQuantityChange = (categoryId, value) => {
    setRecentVoucher(null);
    setSelectedEntriesByCategoryId((current) => {
      const row = current[categoryId];
      if (!row) return current;

      return {
        ...current,
        [categoryId]: {
          ...row,
          quantity: Math.max(
            1,
            Math.min(
              Number(row.stockQuantity || 0),
              Number.parseInt(value, 10) || 1,
            ),
          ),
        },
      };
    });
  };

  const handleCreateVoucher = async (event) => {
    event.preventDefault();

    if (!selectedWarehouseId) {
      toast.error("Vui lòng chọn kho xuất.");
      return;
    }

    if (!Number.isInteger(parsedIssueYear)) {
      toast.error("Năm xuất kho không hợp lệ.");
      return;
    }

    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập tên người nhận hàng.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do xuất kho.");
      return;
    }

    if (!selectedEntries.length) {
      toast.error("Vui lòng chọn ít nhất một mặt hàng để xuất.");
      return;
    }

    try {
      const result = await createIssueVoucher({
        purpose: "OTHER",
        warehouseId: Number(selectedWarehouseId),
        issueYear: parsedIssueYear,
        receiverName: receiverName.trim(),
        reason: reason.trim(),
        note: note.trim() || undefined,
        items: selectedEntries.map((item) => ({
          categoryId: Number(item.categoryId),
          versionId: Number(item.versionId),
          colorId: Number(item.colorId),
          quantity: Number(item.quantity),
        })),
      }).unwrap();

      setRecentVoucher(result?.data?.voucher || null);
      setSelectedEntriesByCategoryId({});
      setReason("");
      setNote("");
      toast.success("Đã tạo phiếu xuất khác.");
      refetchWarehouseItems();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tạo phiếu xuất khác."));
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
              Xuất kho ngoài chế độ
            </Badge>
            <h2 className="text-lg font-semibold sm:text-xl">Xuất khác</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Chọn nhiều loại mặt hàng trực tiếp từ tồn kho hiện có, nhập người
              nhận và lý do xuất kho. Phiếu xuất dùng chung mẫu in với phiếu cấp
              phát để thống nhất biểu mẫu toàn hệ thống.
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleCreateVoucher} className="grid gap-5 2xl:grid-cols-[1.05fr_1.35fr]">
        <Card className="space-y-4 rounded-2xl p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h3 className="font-semibold">Thông tin phiếu xuất</h3>
            <p className="text-sm text-muted-foreground">
              Chọn kho và nhập đầy đủ thông tin nhận hàng trước khi chọn mặt hàng.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="other-issue-warehouse" className="text-sm font-medium">
                Kho xuất
              </label>
              <select
                id="other-issue-warehouse"
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm shadow-sm"
                value={selectedWarehouseId}
                onChange={(event) => {
                  setSelectedWarehouseId(event.target.value);
                  setSelectedEntriesByCategoryId({});
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

            <div className="space-y-2">
              <label htmlFor="other-issue-year" className="text-sm font-medium">
                Năm xuất kho
              </label>
              <Input
                id="other-issue-year"
                type="number"
                min={1900}
                max={3000}
                value={issueYear}
                onChange={(event) => {
                  setIssueYear(event.target.value);
                  setRecentVoucher(null);
                }}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="other-issue-receiver" className="text-sm font-medium">
              Người nhận hàng
            </label>
            <Input
              id="other-issue-receiver"
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
            <label htmlFor="other-issue-reason" className="text-sm font-medium">
              Lý do xuất kho
            </label>
            <Textarea
              id="other-issue-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setRecentVoucher(null);
              }}
              placeholder="Ví dụ: Xuất phục vụ hội thao, cấp bù đột xuất, bảo đảm nhiệm vụ..."
              className="min-h-[108px] rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="other-issue-note" className="text-sm font-medium">
              Ghi chú thêm
            </label>
            <Textarea
              id="other-issue-note"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setRecentVoucher(null);
              }}
              placeholder="Nhập ghi chú nếu cần"
              className="min-h-[96px] rounded-2xl"
            />
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-4 rounded-2xl p-4 shadow-sm sm:p-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Chọn mặt hàng xuất</h3>
                  <p className="text-sm text-muted-foreground">
                    Mỗi loại mặt hàng chọn theo đúng biến thể đang có trong kho.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchWarehouseItems()}
                  disabled={!selectedWarehouseId || isFetchingWarehouseItems}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Tải lại
                </Button>
              </div>

              <Input
                value={itemSearch}
                onChange={(event) => {
                  setItemSearch(event.target.value);
                  setRecentVoucher(null);
                }}
                placeholder="Tìm theo tên quân trang, màu hoặc phiên bản"
                className="h-11 rounded-xl"
                disabled={!selectedWarehouseId}
              />
            </div>

            <div className="overflow-auto rounded-2xl border border-border/70">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-3 py-2">Mặt hàng</th>
                    <th className="px-3 py-2">Phiên bản / màu sắc</th>
                    <th className="px-3 py-2">ĐVT</th>
                    <th className="px-3 py-2">Tồn kho</th>
                    <th className="px-3 py-2">Chọn</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseItems.map((item) => {
                    const categoryId = item?.category?.id;
                    const rowKey = buildVariantKey(item);
                    const selectedRow = selectedEntriesByCategoryId[categoryId];
                    const isSelected =
                      selectedRow && buildVariantKey(selectedRow) === rowKey;

                    return (
                      <tr key={rowKey} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          {item.category?.name || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {[item.version?.name, item.color?.name]
                            .filter(Boolean)
                            .join(" / ") || "Mặc định"}
                        </td>
                        <td className="px-3 py-2">
                          {item.category?.unitOfMeasure?.name || "-"}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {formatQuantity(item.quantity)}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant={isSelected ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => handleToggleEntry(item)}
                            disabled={Number(item.quantity || 0) <= 0}
                          >
                            {isSelected ? "Bỏ chọn" : "Chọn"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {!warehouseItems.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-sm text-muted-foreground"
                      >
                        {!selectedWarehouseId
                          ? "Chọn kho xuất để xem danh sách mặt hàng."
                          : isFetchingWarehouseItems
                            ? "Đang tải mặt hàng trong kho..."
                            : "Không có mặt hàng phù hợp với bộ lọc hiện tại."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="space-y-4 rounded-2xl p-4 shadow-sm sm:p-5">
            <div className="space-y-1">
              <h3 className="font-semibold">Danh sách sẽ xuất</h3>
              <p className="text-sm text-muted-foreground">
                Có thể chọn nhiều loại mặt hàng; mỗi loại được nhập số lượng theo tồn kho hiện có.
              </p>
            </div>

            <div className="overflow-auto rounded-2xl border border-border/70">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-3 py-2">Mặt hàng</th>
                    <th className="px-3 py-2">Biến thể</th>
                    <th className="px-3 py-2">Tồn kho</th>
                    <th className="px-3 py-2">Số lượng xuất</th>
                    <th className="px-3 py-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.map((item) => (
                    <tr key={buildVariantKey(item)} className="border-t">
                      <td className="px-3 py-2 font-medium">{item.categoryName}</td>
                      <td className="px-3 py-2">
                        {[item.versionName, item.colorName]
                          .filter(Boolean)
                          .join(" / ") || "Mặc định"}
                      </td>
                      <td className="px-3 py-2">{formatQuantity(item.stockQuantity)}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={1}
                          max={item.stockQuantity}
                          value={item.quantity}
                          onChange={(event) =>
                            handleSelectedQuantityChange(item.categoryId, event.target.value)
                          }
                          className="h-10 min-w-[120px] rounded-xl"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedEntriesByCategoryId((current) => {
                              setRecentVoucher(null);
                              const next = { ...current };
                              delete next[item.categoryId];
                              return next;
                            })
                          }
                        >
                          Gỡ
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {!selectedEntries.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-8 text-center text-sm text-muted-foreground"
                      >
                        Chưa có mặt hàng nào được chọn để xuất.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
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
                    !selectedWarehouseId ||
                    !selectedEntries.length ||
                    !receiverName.trim() ||
                    !reason.trim()
                  }
                  className="h-11 rounded-xl px-6"
                >
                  {isCreatingVoucher ? "Đang tạo phiếu..." : "Tạo phiếu xuất khác"}
                </Button>
              )}
            </div>
          </Card>

          <RecentVoucherPreview voucher={recentVoucher} />
        </div>
      </form>
    </div>
  );
}
