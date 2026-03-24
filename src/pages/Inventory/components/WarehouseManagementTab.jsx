import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdjustWarehouseCategoryStockMutation,
  useCreateCategoryWarehouseMutation,
  useGetCategoryWarehousesQuery,
  useGetWarehouseCategoryItemsQuery,
  useTransferWarehouseCategoryStockMutation,
  useUpdateCategoryWarehouseMutation,
} from "@/features/inventory/inventoryApi";
import WarehouseControlsCard from "@/pages/Inventory/components/WarehouseControlsCard";
import WarehouseItemsCard from "@/pages/Inventory/components/WarehouseItemsCard";
import WarehouseModal from "@/pages/Inventory/WarehouseModal";
import { getApiErrorMessage } from "@/utils/apiError";

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
    () =>
      warehouses.filter((warehouse) => warehouse.id !== sourceWarehouse?.id),
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
              Phiên bản/Màu: {item?.version?.name || "-"} /{" "}
              {item?.color?.name || "-"}
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

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
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
              Phiên bản/Màu: {item?.version?.name || "-"} /{" "}
              {item?.color?.name || "-"}
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

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function WarehouseManagementTab({ categories = [] }) {
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

  const { data: warehouseData, refetch: refetchWarehouses } =
    useGetCategoryWarehousesQuery();
  const warehouses = warehouseData?.warehouses || [];

  const currentWarehouseId = Number.parseInt(selectedWarehouseId, 10);
  const currentWarehouse =
    warehouses.find((warehouse) => warehouse.id === currentWarehouseId) || null;

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
        window.localStorage.setItem(
          INVENTORY_SELECTED_WAREHOUSE_KEY,
          nextWarehouseId,
        );
      } else {
        window.localStorage.removeItem(INVENTORY_SELECTED_WAREHOUSE_KEY);
      }
    }
  };

  return (
    <div className="space-y-6">
      <WarehouseControlsCard
        currentWarehouse={currentWarehouse}
        selectedWarehouseId={selectedWarehouseId}
        warehouses={warehouses}
        onWarehouseSelectChange={handleWarehouseSelectChange}
        onCreateWarehouse={() => {
          setEditingWarehouse(null);
          setModalOpen(true);
        }}
        onEditCurrentWarehouse={() => {
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
      />

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

      <WarehouseItemsCard
        currentWarehouseId={currentWarehouseId}
        isAdjustingStock={isAdjustingStock}
        isFetchingWarehouseItems={isFetchingWarehouseItems}
        searchKeyword={searchKeyword}
        warehouseItems={warehouseItems}
        onSearchChange={(event) => setSearchKeyword(event.target.value)}
        onOpenTransfer={(item) => {
          setTransferItem(item);
          setTransferModalOpen(true);
        }}
        onOpenAdjust={(item) => {
          setAdjustItem(item);
          setAdjustModalOpen(true);
        }}
      />
    </div>
  );
}
