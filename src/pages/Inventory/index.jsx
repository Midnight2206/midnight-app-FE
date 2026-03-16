import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  useCreateCategoryWarehouseMutation,
  useGetCategoryWarehousesQuery,
  useGetWarehouseCategoryItemsQuery,
  useAdjustWarehouseCategoryStockMutation,
  useTransferWarehouseCategoryStockMutation,
  useUpdateCategoryWarehouseMutation,
} from "@/features/inventory/inventoryApi";
import { useGetCategoriesQuery } from "@/features/category/categoryApi";
import WarehouseModal from "@/pages/Inventory/WarehouseModal";

const INVENTORY_SELECTED_WAREHOUSE_KEY = "inventory_selected_warehouse_id";

function normalizeCategoryIds(rawIds = []) {
  return [
    ...new Set(
      rawIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

function TransferStockModal({
  open,
  onOpenChange,
  sourceWarehouse,
  warehouses,
  item,
  onSubmit,
  isSubmitting,
}) {
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const targetOptions = useMemo(
    () => warehouses.filter((warehouse) => warehouse.id !== sourceWarehouse?.id),
    [warehouses, sourceWarehouse],
  );

  const handleClose = () => {
    if (isSubmitting) return;
    setToWarehouseId("");
    setQuantity("");
    setNote("");
    onOpenChange(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedTarget = Number.parseInt(toWarehouseId, 10);
    const parsedQty = Number.parseInt(quantity, 10);
    if (!Number.isInteger(parsedTarget) || parsedTarget <= 0) return;
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) return;
    await onSubmit({
      toWarehouseId: parsedTarget,
      quantity: parsedQty,
      note: note.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Luân chuyển hàng hoá</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-sm">
            <div>Nguồn: {sourceWarehouse?.name || "-"}</div>
            <div>Mặt hàng: {item?.category?.name || "-"}</div>
            <div>
              Phiên bản/Màu: {item?.version?.name || "-"} / {item?.color?.name || "-"}
            </div>
            <div>Tồn kho nguồn: {item?.quantity ?? 0}</div>
          </div>

          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={toWarehouseId}
            onChange={(event) => setToWarehouseId(event.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Chọn kho đích</option>
            {targetOptions.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Số lượng chuyển"
            disabled={isSubmitting}
          />

          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ghi chú (tuỳ chọn)"
            disabled={isSubmitting}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Xác nhận chuyển
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdjustStockModal({
  open,
  onOpenChange,
  sourceWarehouse,
  item,
  onSubmit,
  isSubmitting,
}) {
  const [delta, setDelta] = useState("");

  const handleClose = () => {
    if (isSubmitting) return;
    setDelta("");
    onOpenChange(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedDelta = Number.parseInt(delta, 10);
    if (!Number.isInteger(parsedDelta) || parsedDelta === 0) return;
    await onSubmit({ delta: parsedDelta });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-sm">
            <div>Kho: {sourceWarehouse?.name || "-"}</div>
            <div>Mặt hàng: {item?.category?.name || "-"}</div>
            <div>
              Phiên bản/Màu: {item?.version?.name || "-"} / {item?.color?.name || "-"}
            </div>
            <div>Tồn kho hiện tại: {item?.quantity ?? 0}</div>
          </div>

          <Input
            type="number"
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
            placeholder="Nhập +số để tăng, -số để giảm"
            disabled={isSubmitting}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(INVENTORY_SELECTED_WAREHOUSE_KEY) || "";
  });
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const { data: warehouseData, refetch: refetchWarehouses } = useGetCategoryWarehousesQuery();
  const { data: categoriesData } = useGetCategoriesQuery({
    status: "active",
    sortBy: "name",
    order: "asc",
  });

  const warehouses = warehouseData?.warehouses || [];
  const categories = categoriesData?.categories || [];

  const currentWarehouseId = Number.parseInt(selectedWarehouseId, 10);
  const currentWarehouse = warehouses.find((warehouse) => warehouse.id === currentWarehouseId) || null;

  const {
    data: warehouseItemsData,
    refetch: refetchWarehouseItems,
    isFetching: isFetchingWarehouseItems,
  } = useGetWarehouseCategoryItemsQuery(
    {
      warehouseId: currentWarehouseId,
      search: searchKeyword.trim() || undefined,
      page: 1,
      limit: 200,
    },
    { skip: !Number.isInteger(currentWarehouseId) || currentWarehouseId <= 0 },
  );

  const warehouseItems = warehouseItemsData?.items || [];

  const [createCategoryWarehouse, { isLoading: isCreatingWarehouse }] =
    useCreateCategoryWarehouseMutation();
  const [updateCategoryWarehouse, { isLoading: isUpdatingWarehouse }] =
    useUpdateCategoryWarehouseMutation();
  const [adjustWarehouseCategoryStock, { isLoading: isAdjustingStock }] =
    useAdjustWarehouseCategoryStockMutation();
  const [transferWarehouseCategoryStock, { isLoading: isTransferringStock }] =
    useTransferWarehouseCategoryStockMutation();

  const handleUpsertWarehouse = async ({ name, categoryIds }) => {
    try {
      if (editingWarehouse?.id) {
        await updateCategoryWarehouse({
          warehouseId: editingWarehouse.id,
          name,
          categoryIds: normalizeCategoryIds(categoryIds),
        }).unwrap();
        toast.success("Đã cập nhật kho.");
      } else {
        await createCategoryWarehouse({
          name,
          categoryIds: normalizeCategoryIds(categoryIds),
        }).unwrap();
        toast.success("Đã tạo kho.");
      }
      setModalOpen(false);
      setEditingWarehouse(null);
      refetchWarehouses();
      if (Number.isInteger(currentWarehouseId) && currentWarehouseId > 0) {
        refetchWarehouseItems();
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu kho."));
      throw error;
    }
  };

  const handleTransferStock = async ({ toWarehouseId, quantity, note }) => {
    if (!currentWarehouseId || !transferItem) return;

    try {
      await transferWarehouseCategoryStock({
        fromWarehouseId: currentWarehouseId,
        toWarehouseId,
        categoryId: transferItem.category.id,
        versionId: transferItem.version.id,
        colorId: transferItem.color.id,
        quantity,
        note,
      }).unwrap();
      toast.success("Đã luân chuyển hàng hoá.");
      refetchWarehouseItems();
      refetchWarehouses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể luân chuyển hàng hoá."));
      throw error;
    }
  };

  const handleAdjustStock = async ({ delta }) => {
    if (!currentWarehouseId || !adjustItem) return;

    try {
      await adjustWarehouseCategoryStock({
        warehouseId: currentWarehouseId,
        categoryId: adjustItem.category.id,
        versionId: adjustItem.version.id,
        colorId: adjustItem.color.id,
        delta,
      }).unwrap();
      toast.success("Đã điều chỉnh tồn kho.");
      refetchWarehouseItems();
      refetchWarehouses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể điều chỉnh tồn kho."));
      throw error;
    }
  };

  const handleWarehouseSelectChange = (event) => {
    const nextWarehouseId = event.target.value;
    setSelectedWarehouseId(nextWarehouseId);
    if (typeof window !== "undefined") {
      if (nextWarehouseId) {
        window.localStorage.setItem(INVENTORY_SELECTED_WAREHOUSE_KEY, nextWarehouseId);
      } else {
        window.localStorage.removeItem(INVENTORY_SELECTED_WAREHOUSE_KEY);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Kho quân trang theo đơn vị</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                setEditingWarehouse(null);
                setModalOpen(true);
              }}
            >
              Thêm kho
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!currentWarehouse}
              onClick={() => {
                if (!currentWarehouse) return;
                setEditingWarehouse({
                  id: currentWarehouse.id,
                  name: currentWarehouse.name,
                  linkedCategoryIds: normalizeCategoryIds(
                    currentWarehouse.linkedCategoryIds || [],
                  ),
                });
                setModalOpen(true);
              }}
            >
              Chỉnh sửa kho đang chọn
            </Button>
          </div>
        </div>

        <select
          className="h-9 w-full max-w-md rounded-md border bg-background px-3 text-sm"
          value={selectedWarehouseId}
          onChange={handleWarehouseSelectChange}
        >
          <option value="">Chọn kho để xem tồn</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>

        {modalOpen ? (
          <WarehouseModal
            key={editingWarehouse?.id || "new-warehouse"}
            open={modalOpen}
            onOpenChange={(next) => {
              setModalOpen(next);
              if (!next) setEditingWarehouse(null);
            }}
            initialData={editingWarehouse}
            categories={categories}
            onSubmit={handleUpsertWarehouse}
            isSubmitting={isCreatingWarehouse || isUpdatingWarehouse}
          />
        ) : null}

        {transferModalOpen ? (
          <TransferStockModal
            open={transferModalOpen}
            onOpenChange={(next) => {
              setTransferModalOpen(next);
              if (!next) setTransferItem(null);
            }}
            sourceWarehouse={currentWarehouse}
            warehouses={warehouses}
            item={transferItem}
            onSubmit={handleTransferStock}
            isSubmitting={isTransferringStock}
          />
        ) : null}

        {adjustModalOpen ? (
          <AdjustStockModal
            open={adjustModalOpen}
            onOpenChange={(next) => {
              setAdjustModalOpen(next);
              if (!next) setAdjustItem(null);
            }}
            sourceWarehouse={currentWarehouse}
            item={adjustItem}
            onSubmit={handleAdjustStock}
            isSubmitting={isAdjustingStock}
          />
        ) : null}

      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Tồn kho theo mặt hàng</h3>
          <Input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Tìm theo tên, phiên bản, cỡ số..."
            className="max-w-xs"
            disabled={!currentWarehouseId}
          />
        </div>

        {!currentWarehouseId ? (
          <div className="text-sm text-muted-foreground">Vui lòng chọn kho để xem dữ liệu.</div>
        ) : isFetchingWarehouseItems ? (
          <div className="text-sm text-muted-foreground">Đang tải dữ liệu tồn kho...</div>
        ) : (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Mặt hàng</th>
                  <th className="py-2 px-3">Tồn kho</th>
                  <th className="py-2 px-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {warehouseItems.map((item) => (
                  <tr
                    key={`${item.category.id}-${item.version.id}-${item.color.id}`}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 px-3">{item.category.name}</td>
                    <td className="py-2 px-3">{item.quantity ?? 0}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTransferItem(item);
                            setTransferModalOpen(true);
                          }}
                          disabled={(item.quantity ?? 0) <= 0}
                        >
                          Luân chuyển
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdjustItem(item);
                            setAdjustModalOpen(true);
                          }}
                          disabled={isAdjustingStock}
                        >
                          Điều chỉnh tồn
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!warehouseItems.length ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">
                      Kho này chưa có mặt hàng nào.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
