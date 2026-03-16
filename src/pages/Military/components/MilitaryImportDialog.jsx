import { AlertTriangle, Download, Upload } from "lucide-react";

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

export default function MilitaryImportDialog({
  open,
  onOpenChange,
  onDownloadTemplate,
  isDownloadingTemplate,
  selectedType,
  onChangeSelectedType,
  militaryTypes,
  onFileChange,
  onCancel,
  onImport,
  isImporting,
  importReport,
}) {
  const conflicts = Array.isArray(importReport?.conflicts) ? importReport.conflicts : [];
  const importedRows = Number(importReport?.importedRows || 0);
  const skippedRows = Number(importReport?.skippedRows || 0);
  const totalRows = importedRows + skippedRows;
  const skipRate = totalRows > 0 ? skippedRows / totalRows : 0;
  const summaryTone =
    skippedRows === 0
      ? "success"
      : skipRate >= 0.5
        ? "danger"
        : "warning";

  const toneClasses = {
    success: {
      panel: "border-emerald-200 bg-emerald-50/60",
      title: "text-emerald-900",
      badge: "border-emerald-300 bg-emerald-100 text-emerald-800",
      skipped: "text-emerald-700",
    },
    warning: {
      panel: "border-amber-200 bg-amber-50/40",
      title: "text-amber-900",
      badge: "border-amber-300 bg-amber-100 text-amber-800",
      skipped: "text-amber-700",
    },
    danger: {
      panel: "border-red-200 bg-red-50/50",
      title: "text-red-900",
      badge: "border-red-300 bg-red-100 text-red-800",
      skipped: "text-red-700",
    },
  }[summaryTone];

  const summaryLabel =
    summaryTone === "success"
      ? "Import sạch"
      : summaryTone === "warning"
        ? "Import có xung đột"
        : "Import xung đột cao";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import danh sách quân nhân</DialogTitle>
          <DialogDescription>
            Chỉ import theo từng danh sách một lần thao tác.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto pr-1">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Lưu ý quan trọng trước khi import
            </p>
            <p className="mt-1 text-xs leading-5">
              Import có thể làm rõ và mở rộng lịch sử luân chuyển đơn vị của quân nhân theo năm chuyển
              đến/chuyển đi. Chỉ thực hiện khi dữ liệu nguồn đã được kiểm tra kỹ.
            </p>
            <p className="mt-1 text-xs leading-5">
              Hệ thống cho phép import bổ sung khi đã có dữ liệu trước đó, các quân nhân không trùng mã
              sẽ được thêm mới.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Danh sách import</p>
            <select
              value={selectedType}
              onChange={(e) => onChangeSelectedType(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              disabled={militaryTypes.length === 0}
            >
              {militaryTypes.length === 0 ? <option value="">Chưa có danh sách</option> : null}
              {militaryTypes.map((item) => (
                <option key={`mil-import-type-${item.id}`} value={item.code}>
                  {item.code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onDownloadTemplate}
              disabled={isDownloadingTemplate || !selectedType}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadingTemplate ? "Đang tải..." : "Tải template theo danh sách"}
            </Button>
            <Input
              type="file"
              accept=".xlsx"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="w-full md:max-w-md"
            />
          </div>

          {importReport && (
            <div className={`space-y-3 rounded-lg border p-3 ${toneClasses.panel}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`text-sm font-semibold ${toneClasses.title}`}>Kết quả import</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${toneClasses.badge}`}>
                  {summaryLabel}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">Import thành công</p>
                  <p className="text-lg font-semibold">{importedRows}</p>
                </div>
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">Thêm mới quân nhân</p>
                  <p className="text-lg font-semibold">{importReport.importedNewRows || 0}</p>
                </div>
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">Import theo điều chuyển</p>
                  <p className="text-lg font-semibold">{importReport.importedTransferRows || 0}</p>
                </div>
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">Bị bỏ qua</p>
                  <p className={`text-lg font-semibold ${toneClasses.skipped}`}>{skippedRows}</p>
                </div>
              </div>

              {conflicts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-900">
                    Chi tiết dòng bị bỏ qua (xung đột đơn vị/năm)
                  </p>
                  <div className="max-h-56 space-y-2 overflow-auto rounded border bg-background p-2">
                    {conflicts.map((item, index) => (
                      <div
                        key={`${item.militaryCode}-${item.rowNumber}-${index}`}
                        className="space-y-1 rounded-md border p-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            <b>Dòng:</b> {item.rowNumber || "-"}
                          </span>
                          <span>
                            <b>Mã:</b> {item.militaryCode || "-"}
                          </span>
                          <span>
                            <b>Đơn vị:</b> {item.existingUnitName || "-"}
                          </span>
                        </div>
                        <p className="break-words text-muted-foreground">{item.reason || "-"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isImporting}>
            Hủy
          </Button>
          <Button onClick={onImport} disabled={isImporting || !selectedType} className="gap-2">
            <Upload className="h-4 w-4" />
            {isImporting ? "Đang import..." : "Import danh sách"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
