import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const EMPTY_CATEGORIES = [];

function normalizeCategoryIds(rawIds = []) {
  return [
    ...new Set(
      rawIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

export default function WarehouseModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  categories = EMPTY_CATEGORIES,
  isSubmitting = false,
}) {
  const isEdit = Boolean(initialData?.id);
  const [name, setName] = useState(initialData?.name || "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() =>
    normalizeCategoryIds(initialData?.linkedCategoryIds || []),
  );

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    await onSubmit({
      name: trimmedName,
      categoryIds: normalizeCategoryIds(selectedCategoryIds),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật kho" : "Tạo kho mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tên kho"
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium">Liên kết mặt hàng</p>
            <div className="max-h-64 overflow-auto rounded-md border p-3 space-y-2">
              {categories.length ? (
                categories.map((category) => {
                  const checked = selectedCategoryIds.includes(category.id);
                  return (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          setSelectedCategoryIds((prev) => {
                            const current = new Set(prev);
                            if (next === true) current.add(category.id);
                            else current.delete(category.id);
                            return [...current];
                          });
                        }}
                      />
                      <span>{category.name}</span>
                    </label>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">
                  Chưa có mặt hàng trong danh mục.
                </div>
              )}
            </div>
          </div>

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
            <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full sm:w-auto">
              {isEdit ? "Cập nhật" : "Tạo kho"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
