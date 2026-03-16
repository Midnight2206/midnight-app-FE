import { Plus, Save, X, Sparkles } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/AppLoading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import ChipInput from "@/components/ChipInput";
import { PRESET_SIZES } from "@/utils/constants";

function toNumberList(values = []) {
  return [...new Set(values.map((value) => Number.parseInt(value, 10)).filter((id) => Number.isInteger(id) && id > 0))];
}

function VariantPicker({ label, options, value = [], onChange }) {
  const selected = toNumberList(value);

  return (
    <div className="space-y-2">
      <Label className="font-semibold">{label}</Label>
      <div className="max-h-32 overflow-auto rounded-md border p-2 space-y-2">
        {options.length ? (
          options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label key={option.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) => {
                    const nextSet = new Set(selected);
                    if (next === true) nextSet.add(option.id);
                    else nextSet.delete(option.id);
                    onChange([...nextSet]);
                  }}
                />
                <span>{option.name}</span>
              </label>
            );
          })
        ) : (
          <div className="text-xs text-muted-foreground">Chưa có dữ liệu phù hợp</div>
        )}
      </div>
    </div>
  );
}

export default function CategoryModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  unitOfMeasures = [],
  versions = [],
  colors = [],
}) {
  const isEdit = Boolean(initialData);

  const defaultValues = useMemo(
    () => ({
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      unitOfMeasureId: initialData?.unitOfMeasureId ? String(initialData.unitOfMeasureId) : "",
      totalQuantity: String(initialData?.totalQuantity ?? 0),
      sizes: initialData?.sizes ?? [],
      versionIds: toNumberList(initialData?.versionIds ?? []),
      colorIds: toNumberList(initialData?.colorIds ?? []),
    }),
    [initialData],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = async (data) => {
    if (isEdit && !isDirty) return;

    const payload = {
      name: String(data.name || "").trim(),
      code: String(data.code || "").trim() || undefined,
      unitOfMeasureId: data.unitOfMeasureId ? Number(data.unitOfMeasureId) : undefined,
      totalQuantity: Math.max(0, Number.parseInt(data.totalQuantity || "0", 10) || 0),
      sizes: Array.isArray(data.sizes) ? data.sizes : [],
      versionIds: toNumberList(data.versionIds),
      colorIds: toNumberList(data.colorIds),
    };

    await onSubmit(payload);
    reset(defaultValues);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset(defaultValues);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                {isEdit ? (
                  <Save className="h-5 w-5 text-primary" />
                ) : (
                  <Plus className="h-5 w-5 text-primary" />
                )}
              </div>

              <div>
                <DialogTitle className="text-2xl font-bold">
                  {isEdit ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Quản lý danh mục & size sản phẩm</p>
              </div>
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={handleClose} disabled={isSubmitting}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Tên danh mục
              <span className="text-destructive">*</span>
            </Label>

            <Controller
              name="name"
              control={control}
              rules={{
                required: "Vui lòng nhập tên danh mục",
                minLength: {
                  value: 2,
                  message: "Tên danh mục phải có ít nhất 2 ký tự",
                },
                maxLength: {
                  value: 50,
                  message: "Tên danh mục không được quá 50 ký tự",
                },
              }}
              render={({ field }) => (
                <div className="space-y-1">
                  <Input
                    {...field}
                    placeholder="Ví dụ: Áo thun, Quần jean, Giày sneaker..."
                    className={errors.name ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Controller
              name="code"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Mã category" disabled={isSubmitting} />}
            />
            <Controller
              name="unitOfMeasureId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="">Đơn vị tính</option>
                  {unitOfMeasures.map((unit) => (
                    <option key={unit.id} value={String(unit.id)}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              )}
            />
            <Controller
              name="totalQuantity"
              control={control}
              render={({ field }) => (
                <Input {...field} type="number" min={0} placeholder="Tồn kho" disabled={isSubmitting} />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">
              Sizes
              <span className="ml-1 text-xs text-muted-foreground font-normal">(Tùy chọn)</span>
            </Label>

            <Controller
              name="sizes"
              control={control}
              rules={{
                validate: (value) => (value.length > 50 ? "Số lượng size không được vượt quá 50" : true),
              }}
              render={({ field }) => (
                <div className="space-y-1">
                  <ChipInput
                    label="Cỡ số"
                    placeholder="Nhập cỡ số và nhấn Enter..."
                    value={field.value}
                    onChange={field.onChange}
                    presets={PRESET_SIZES}
                    duplicateMessage="Cỡ số đã tồn tại: "
                  />
                  {errors.sizes && <p className="text-sm text-destructive">{errors.sizes.message}</p>}
                </div>
              )}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Controller
              name="versionIds"
              control={control}
              render={({ field }) => (
                <VariantPicker
                  label="Phiên bản"
                  options={versions}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="colorIds"
              control={control}
              render={({ field }) => (
                <VariantPicker
                  label="Màu sắc"
                  options={colors}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </Button>

            <Button type="submit" disabled={isSubmitting || (isEdit && !isDirty)}>
              {isSubmitting ? (
                <InlineLoader label="Đang lưu..." textClassName="font-medium" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? "Cập nhật" : "Thêm mới"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
