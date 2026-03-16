import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MILITARY_RANK_OPTIONS = [
  { code: "THIEU_UY", label: "Thiếu úy" },
  { code: "TRUNG_UY", label: "Trung úy" },
  { code: "THUONG_UY", label: "Thượng úy" },
  { code: "DAI_UY", label: "Đại úy" },
  { code: "THIEU_TA", label: "Thiếu tá" },
  { code: "TRUNG_TA", label: "Trung tá" },
  { code: "THUONG_TA", label: "Thượng tá" },
  { code: "DAI_TA", label: "Đại tá" },
  { code: "THIEU_TUONG", label: "Thiếu tướng" },
  { code: "TRUNG_TUONG", label: "Trung tướng" },
  { code: "THUONG_TUONG", label: "Thượng tướng" },
  { code: "DAI_TUONG", label: "Đại tướng" },
  { code: "BINH_NHI", label: "Binh nhì" },
  { code: "BINH_NHAT", label: "Binh nhất" },
  { code: "HA_SI", label: "Hạ sĩ" },
  { code: "TRUNG_SI", label: "Trung sĩ" },
  { code: "THUONG_SI", label: "Thượng sĩ" },
];

export default function ExternalIncreaseForm({
  form,
  onFieldChange,
  onSubmit,
  isSubmitting,
  currentUnitName,
  assignedUnits,
  militaryTypes,
  canManageTransfer,
}) {
  if (!canManageTransfer) return null;
  const typeOptions = Array.isArray(militaryTypes) ? militaryTypes : [];
  const assignedUnitOptions = Array.isArray(assignedUnits) ? assignedUnits : [];

  return (
    <div className="border-b bg-muted/20 px-4 py-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold">Tiếp nhận quân nhân từ ngoài hệ thống</h4>
        <p className="text-xs text-muted-foreground">
          Dùng form này khi quân nhân chuyển đến từ đơn vị chưa có trong hệ thống, không thông qua
          yêu cầu transfer nội bộ.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Mã quân nhân</p>
          <Input
            value={form.militaryCode}
            onChange={(e) => onFieldChange("militaryCode", e.target.value)}
            placeholder="Ví dụ: QN001"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Họ tên</p>
          <Input
            value={form.fullname}
            onChange={(e) => onFieldChange("fullname", e.target.value)}
            placeholder="Nhập họ tên quân nhân"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Cấp bậc</p>
          <select
            value={form.rank}
            onChange={(e) => onFieldChange("rank", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Chọn cấp bậc</option>
            {MILITARY_RANK_OPTIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Giới tính</p>
          <select
            value={form.gender}
            onChange={(e) => onFieldChange("gender", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Chọn giới tính</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Loại quân nhân</p>
          <select
            value={form.type}
            onChange={(e) => onFieldChange("type", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Chọn loại quân nhân</option>
            {typeOptions.map((item) => (
              <option key={item.id} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Assigned unit tiếp nhận</p>
          <select
            value={form.assignedUnitId}
            onChange={(e) => onFieldChange("assignedUnitId", e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Chọn assigned unit</option>
            {assignedUnitOptions.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Năm PH, CCĐ lần đầu</p>
          <Input
            type="number"
            min={1900}
            max={2100}
            value={String(form.initialCommissioningYear)}
            onChange={(e) => onFieldChange("initialCommissioningYear", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Chức vụ</p>
          <Input
            value={form.position}
            onChange={(e) => onFieldChange("position", e.target.value)}
            placeholder="Nhập chức vụ hiện tại"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Nguồn chuyển đến</p>
          <Input
            value={form.fromExternalUnitName}
            onChange={(e) => onFieldChange("fromExternalUnitName", e.target.value)}
            placeholder="Ví dụ: Ban CHQS huyện chưa có trên hệ thống"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Đơn vị tiếp nhận</p>
          <Input value={currentUnitName || ""} readOnly disabled />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Năm chuyển đến</p>
          <Input
            type="number"
            min={1900}
            max={2100}
            value={String(form.transferYear)}
            onChange={(e) => onFieldChange("transferYear", e.target.value)}
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-xs text-muted-foreground">Ghi chú</p>
          <Textarea
            rows={3}
            maxLength={191}
            value={form.note}
            onChange={(e) => onFieldChange("note", e.target.value)}
            placeholder="Nhập ghi chú về nguồn tăng quân số..."
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Đang tiếp nhận..." : "Tiếp nhận từ ngoài hệ thống"}
        </Button>
      </div>
    </div>
  );
}
