import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InlineLoader } from "@/components/AppLoading";

export default function RestoreDialog({
  open,
  onOpenChange,
  restoreData,
  keepOldSizes,
  setKeepOldSizes,
  onConfirm,
  isLoading,
}) {
  if (!restoreData) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Khôi phục danh mục đã xóa
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Danh mục <strong>"{restoreData.name}"</strong> đã bị xóa trước
                đó. Bạn có muốn khôi phục danh mục này không?
              </p>

              {restoreData.oldSizes.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Sizes cũ ({restoreData.oldSizes.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {restoreData.oldSizes.map((size, i) => (
                      <Badge key={i} variant="secondary">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {restoreData.newSizes.length > 0 && (
                <div className="rounded-lg border bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Sizes mới ({restoreData.newSizes.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {restoreData.newSizes.map((size, i) => (
                      <Badge key={i} variant="default">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {restoreData.newSizes.length > 0 &&
                restoreData.oldSizes.length > 0 && (
                  <div className="flex items-start space-x-3 rounded-lg border bg-accent/50 p-4">
                    <Checkbox
                      id="keep-old-sizes"
                      checked={keepOldSizes}
                      onCheckedChange={setKeepOldSizes}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="keep-old-sizes"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Giữ sizes cũ
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Bỏ chọn để sử dụng sizes mới bạn vừa nhập
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? <InlineLoader label="Đang khôi phục..." textClassName="font-medium" /> : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Khôi phục
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
