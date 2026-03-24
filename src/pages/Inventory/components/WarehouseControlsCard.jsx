import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WarehouseControlsCard({
  currentWarehouse,
  selectedWarehouseId,
  warehouses = [],
  onWarehouseSelectChange,
  onCreateWarehouse,
  onEditCurrentWarehouse,
}) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold">Kho quân trang theo đơn vị</h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi tồn kho từng kho và thao tác điều chỉnh, luân chuyển nhanh.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={onCreateWarehouse}
          >
            Thêm kho
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!currentWarehouse}
            onClick={onEditCurrentWarehouse}
          >
            Chỉnh sửa kho đang chọn
          </Button>
        </div>
      </div>

      <select
        className="h-9 w-full max-w-md rounded-md border bg-background px-3 text-sm"
        value={selectedWarehouseId}
        onChange={onWarehouseSelectChange}
      >
        <option value="">Chọn kho để xem tồn</option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </option>
        ))}
      </select>
    </Card>
  );
}
