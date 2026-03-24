import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function WarehouseItemsCard({
  currentWarehouseId,
  isAdjustingStock,
  isFetchingWarehouseItems,
  searchKeyword,
  warehouseItems = [],
  onSearchChange,
  onOpenTransfer,
  onOpenAdjust,
}) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold">Tồn kho theo mặt hàng</h3>
          <p className="text-sm text-muted-foreground">
            Tìm nhanh danh mục đang có trong kho đã chọn.
          </p>
        </div>
        <Input
          value={searchKeyword}
          onChange={onSearchChange}
          placeholder="Tìm theo tên, phiên bản, cỡ số..."
          className="w-full max-w-none sm:max-w-xs"
          disabled={!currentWarehouseId}
        />
      </div>

      {!currentWarehouseId ? (
        <div className="text-sm text-muted-foreground">
          Vui lòng chọn kho để xem dữ liệu.
        </div>
      ) : isFetchingWarehouseItems ? (
        <div className="text-sm text-muted-foreground">
          Đang tải dữ liệu tồn kho...
        </div>
      ) : (
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr className="border-b text-left">
                <th className="px-3 py-2">Mặt hàng</th>
                <th className="px-3 py-2">Tồn kho</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {warehouseItems.map((item) => (
                <tr
                  key={`${item.category.id}-${item.version.id}-${item.color.id}`}
                  className="border-b last:border-0"
                >
                  <td className="px-3 py-2">{item.category.name}</td>
                  <td className="px-3 py-2">{item.quantity ?? 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => onOpenTransfer(item)}
                        disabled={(item.quantity ?? 0) <= 0}
                      >
                        Luân chuyển
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => onOpenAdjust(item)}
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
                  <td
                    colSpan={3}
                    className="py-4 text-center text-muted-foreground"
                  >
                    Kho này chưa có mặt hàng nào.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
