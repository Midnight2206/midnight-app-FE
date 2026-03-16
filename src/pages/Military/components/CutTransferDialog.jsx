import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CutTransferDialog({
  open,
  onOpenChange,
  cutTransferMilitary,
  cutTransferTargetUnitId,
  setCutTransferTargetUnitId,
  transferTargetUnits,
  cutTransferTypeId,
  setCutTransferTypeId,
  cutTransferTypeOptions,
  cutTransferYear,
  setCutTransferYear,
  cutTransferNote,
  setCutTransferNote,
  onCancel,
  onSubmit,
  isCreatingCutTransferRequest,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cắt bảo đảm quân trang</DialogTitle>
          <DialogDescription>
            Thông tin quân nhân được tự động điền từ hồ sơ hiện tại và không cho chỉnh sửa.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Họ tên</p>
            <Input value={cutTransferMilitary?.fullname || ""} readOnly disabled />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Mã quân nhân</p>
            <Input value={cutTransferMilitary?.militaryCode || ""} readOnly disabled />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Cấp bậc</p>
            <Input value={cutTransferMilitary?.rank || ""} readOnly disabled />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Chức vụ</p>
            <Input value={cutTransferMilitary?.position || ""} readOnly disabled />
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs text-muted-foreground">Đơn vị hiện tại</p>
            <Input
              value={cutTransferMilitary?.assignedUnit || ""}
              readOnly
              disabled
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Loại quân nhân</p>
            <select
              value={cutTransferTypeId}
              onChange={(e) => setCutTransferTypeId(e.target.value)}
              disabled={cutTransferTypeOptions.length === 0}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Chọn loại quân nhân</option>
              {cutTransferTypeOptions.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Chuyển đến đơn vị</p>
            <select
              value={cutTransferTargetUnitId}
              onChange={(e) => setCutTransferTargetUnitId(e.target.value)}
              disabled={transferTargetUnits.length === 0}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Chọn đơn vị nhận bảo đảm</option>
              {transferTargetUnits.map((unit) => (
                <option key={unit.id} value={String(unit.id)}>
                  {unit.id} - {unit.name}
                </option>
              ))}
            </select>
            {transferTargetUnits.length === 0 ? (
              <p className="text-xs text-destructive">Chưa có đơn vị đích khả dụng để điều chuyển.</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Năm điều chuyển</p>
            <Input
              type="number"
              value={String(cutTransferYear)}
              onChange={(e) => setCutTransferYear(e.target.value)}
              min={1900}
              max={2100}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs text-muted-foreground">Ghi chú (tùy chọn)</p>
            <textarea
              value={cutTransferNote}
              onChange={(e) => setCutTransferNote(e.target.value)}
              rows={3}
              maxLength={191}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Nhập ghi chú cho đơn vị nhận bảo đảm..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isCreatingCutTransferRequest}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isCreatingCutTransferRequest || !cutTransferMilitary?.id}
          >
            {isCreatingCutTransferRequest ? "Đang gửi yêu cầu..." : "Xác nhận cắt và gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
