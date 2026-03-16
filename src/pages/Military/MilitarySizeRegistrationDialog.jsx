import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButtonLabel, SectionLoader } from "@/components/AppLoading";

export default function MilitarySizeRegistrationDialog({
  open,
  onOpenChange,
  military,
  year,
  categories,
  registrations,
  isLoadingOptions,
  isLoadingRegistrations,
  isSaving,
  onSubmit,
}) {
  const [keyword, setKeyword] = useState("");

  const initialMap = useMemo(() => {
    const map = {};
    for (const item of registrations || []) {
      map[String(item.categoryId)] = String(item.sizeId);
    }
    return map;
  }, [registrations]);

  const [selectedByCategory, setSelectedByCategory] = useState(() => initialMap);

  const filteredCategories = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return categories || [];

    return (categories || []).filter((category) => {
      return String(category.name || "").toLowerCase().includes(q);
    });
  }, [categories, keyword]);

  const handleSelect = (categoryId, sizeId) => {
    setSelectedByCategory((prev) => {
      const next = { ...prev };
      if (!sizeId) {
        delete next[String(categoryId)];
        return next;
      }
      next[String(categoryId)] = String(sizeId);
      return next;
    });
  };

  const handleSave = async () => {
    const payload = Object.entries(selectedByCategory).map(
      ([categoryId, sizeId]) => ({
        categoryId: Number(categoryId),
        sizeId: Number(sizeId),
      }),
    );

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Đăng ký cỡ số quân nhân năm {year}</DialogTitle>
          <DialogDescription>
            {military
              ? `${military.fullname} (${military.militaryCode})`
              : "Chọn quân nhân để đăng ký cỡ số."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-hidden">
          <Input
            placeholder="Tìm danh mục theo tên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          {isLoadingOptions || isLoadingRegistrations ? (
            <SectionLoader label="Đang tải dữ liệu đăng ký cỡ số..." />
          ) : filteredCategories.length === 0 ? (
            <Card className="surface p-4 text-sm text-muted-foreground">
              Không có danh mục để đăng ký cỡ số.
            </Card>
          ) : (
            <div className="max-h-[52vh] overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-2 text-left">Danh mục</th>
                    <th className="px-3 py-2 text-left">Cỡ số</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => {
                    const selectedSizeId = selectedByCategory[String(category.id)] || "";

                    return (
                      <tr key={category.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{category.name}</td>
                        <td className="px-3 py-2">
                          <select
                            className="h-9 w-full rounded-md border border-input bg-background px-2"
                            value={selectedSizeId}
                            onChange={(e) => handleSelect(category.id, e.target.value)}
                          >
                            <option value="">Chưa đăng ký</option>
                            {(category.sizes || []).map((size) => (
                              <option key={size.id} value={String(size.id)}>
                                {size.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoadingOptions || isLoadingRegistrations}>
            <LoadingButtonLabel
              loading={isSaving}
              loadingText="Đang lưu đăng ký..."
              defaultText="Lưu đăng ký cỡ số"
            />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
