import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLoader } from "@/components/AppLoading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RegistrationImportDialog({
  open,
  onOpenChange,
  selectedYear,
  registrationTemplateIncludeExisting,
  onChangeRegistrationTemplateIncludeExisting,
  registrationImportKeepExisting,
  onChangeRegistrationImportKeepExisting,
  registrationCategories,
  selectedRegistrationCategoryIds,
  setSelectedRegistrationCategoryIds,
  isLoadingRegistrationOptions,
  isFetchingRegistrationOptions,
  onToggleRegistrationCategory,
  onDownloadRegistrationTemplate,
  isDownloadingRegistrationTemplate,
  onRegistrationFileChange,
  onPreviewRegistrationImport,
  isPreviewingRegistrationImport,
  onImportRegistrations,
  isImportingRegistrations,
  registrationImportPreview,
  onClose,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import đăng ký cỡ số</DialogTitle>
          <DialogDescription>
            Tạo template theo năm, xem trước dữ liệu và xác nhận import.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <span>Năm thao tác: {selectedYear}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={registrationTemplateIncludeExisting}
                onChange={(e) => onChangeRegistrationTemplateIncludeExisting(e.target.checked)}
              />
              Template có sẵn cỡ số hiện tại của quân nhân
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={registrationImportKeepExisting}
                onChange={(e) => onChangeRegistrationImportKeepExisting(e.target.checked)}
              />
              Giữ cỡ số cũ của các danh mục không import
            </label>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Danh mục áp dụng</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setSelectedRegistrationCategoryIds(
                    registrationCategories.map((category) => category.id),
                  )
                }
              >
                Chọn tất cả
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedRegistrationCategoryIds([])}
              >
                Bỏ chọn
              </Button>
            </div>

            {isLoadingRegistrationOptions || isFetchingRegistrationOptions ? (
              <SectionLoader label="Đang tải danh mục cỡ số..." />
            ) : registrationCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có danh mục để tạo template.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {registrationCategories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRegistrationCategoryIds.includes(category.id)}
                      onChange={() => onToggleRegistrationCategory(category.id)}
                    />
                    <span>
                      {category.name} ({category.sizes?.length || 0} cỡ)
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="data-toolbar">
            <Button
              type="button"
              variant="outline"
              onClick={onDownloadRegistrationTemplate}
              disabled={
                isDownloadingRegistrationTemplate || selectedRegistrationCategoryIds.length === 0
              }
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadingRegistrationTemplate ? "Đang tạo template..." : "Tạo template cỡ số"}
            </Button>

            <Input
              type="file"
              accept=".xlsx"
              onChange={(e) => onRegistrationFileChange(e.target.files?.[0] || null)}
              className="w-full md:max-w-sm"
            />

            <Button
              onClick={onPreviewRegistrationImport}
              disabled={isPreviewingRegistrationImport}
              variant="outline"
              className="gap-2"
            >
              {isPreviewingRegistrationImport ? "Đang preview..." : "Xem trước import"}
            </Button>

            <Button
              onClick={onImportRegistrations}
              disabled={isImportingRegistrations || !registrationImportPreview?.approval?.token}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImportingRegistrations ? "Đang import cỡ số..." : "Import cỡ số"}
            </Button>
          </div>

          {registrationImportPreview && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2">
              <p className="text-sm font-semibold">
                Preview import đăng ký cỡ số năm {registrationImportPreview.year || selectedYear}
              </p>
              <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
                <p>Tổng dòng template: {registrationImportPreview.summary?.totalTemplateRows ?? 0}</p>
                <p>Dòng hợp lệ: {registrationImportPreview.summary?.validRows ?? 0}</p>
                <p>Quân nhân bị ảnh hưởng: {registrationImportPreview.summary?.affectedMilitaries ?? 0}</p>
                <p>Tổng danh mục import: {registrationImportPreview.summary?.categoryCount ?? 0}</p>
                <p>Lượt đăng ký mới trong file: {registrationImportPreview.summary?.totalRegistrationAssignments ?? 0}</p>
                <p>Bản ghi cũ sẽ bị thay thế: {registrationImportPreview.summary?.existingRowsToReplace ?? 0}</p>
              </div>

              {Array.isArray(registrationImportPreview.warnings) &&
                registrationImportPreview.warnings.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">Cảnh báo</p>
                    <ul className="list-disc pl-5 text-sm text-amber-900">
                      {registrationImportPreview.warnings.map((warning, index) => (
                        <li key={`${warning}-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {registrationImportPreview.approval?.expiresAt && (
                <p className="text-xs text-amber-900">
                  Xác nhận preview có hiệu lực đến:{" "}
                  {new Date(registrationImportPreview.approval.expiresAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isImportingRegistrations}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
