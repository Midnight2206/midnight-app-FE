import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  OverlayLoader,
  PageLoader,
  SectionLoader,
} from "@/components/AppLoading";
import { ACCESS_RULES } from "@/features/auth/authorization";
import { useAuthorization } from "@/features/auth/useAuthorization";
import {
  useGetBackupFilesQuery,
  useRestoreBackupFromDriveMutation,
  useRunBackupNowMutation,
} from "@/features/backups/backupApi";
import { getApiErrorMessage } from "@/utils/apiError";

function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let size = value;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
}

export default function BackupRecoveryPage() {
  const { can } = useAuthorization();
  const canAccess = can(ACCESS_RULES.backupRecoveryPage);

  const [pageToken, setPageToken] = useState("");
  const [selectedFileId, setSelectedFileId] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetBackupFilesQuery(
    {
      pageSize: 30,
      pageToken,
    },
    {
      skip: !canAccess,
    },
  );

  const [runBackupNow, { isLoading: isRunningBackup }] = useRunBackupNowMutation();
  const [restoreBackupFromDrive, { isLoading: isRestoring }] =
    useRestoreBackupFromDriveMutation();

  const files = useMemo(
    () => (Array.isArray(data?.files) ? data.files : []),
    [data],
  );

  const runtimeState = data?.state || {};
  const nextPageToken = data?.nextPageToken || "";

  const restoreBusy = isRestoring || runtimeState.activeTask === "restore";
  const backupBusy = isRunningBackup || runtimeState.activeTask === "backup";
  const busy = restoreBusy || backupBusy;

  const handleRunBackupNow = async () => {
    try {
      await runBackupNow().unwrap();
      toast.success("Đã chạy backup thủ công thành công.");
      refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể chạy backup thủ công."));
    }
  };

  const handleRestore = async (file) => {
    const confirmed = window.confirm(
      `Khôi phục DB từ file ${file?.name || file?.id}? Hệ thống sẽ ghi đè dữ liệu hiện tại.`,
    );
    if (!confirmed) return;

    setSelectedFileId(file.id);
    try {
      await restoreBackupFromDrive({
        fileId: file.id,
        fileName: file.name,
      }).unwrap();
      toast.success("Khôi phục dữ liệu thành công.");
      refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khôi phục dữ liệu thất bại."));
    } finally {
      setSelectedFileId("");
    }
  };

  if (canAccess && isLoading) {
    return (
      <PageLoader
        title="Đang tải danh sách backup..."
        description="Hệ thống đang đồng bộ dữ liệu file sao lưu từ Google Drive."
      />
    );
  }

  if (!canAccess) {
    return (
      <div className="p-6">
        <Card className="p-6 text-sm text-muted-foreground">
          Bạn chưa có quyền truy cập trang khôi phục dữ liệu.
        </Card>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 p-4 md:p-6">
      <OverlayLoader show={busy || isFetching} label="Đang xử lý dữ liệu backup..." />

      <Card className="surface p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Khôi phục dữ liệu từ backup Drive</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chỉ super admin mới có quyền chạy backup thủ công và khôi phục DB.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={busy || isFetching}>
              Làm mới
            </Button>
            <Button onClick={handleRunBackupNow} disabled={busy}>
              Chạy backup ngay
            </Button>
          </div>
        </div>
      </Card>

      <Card className="surface p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Trạng thái scheduler: {runtimeState.hasScheduler ? "ON" : "OFF"}</span>
          <span>|</span>
          <span>Tác vụ hiện tại: {runtimeState.activeTask || "idle"}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Tên file</th>
                <th className="py-2 pr-3">Kích thước</th>
                <th className="py-2 pr-3">Tạo lúc</th>
                <th className="py-2 pr-3">Drive</th>
                <th className="py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isRowBusy = isRestoring && selectedFileId === file.id;

                return (
                  <tr key={file.id} className="border-b border-border/40 align-top">
                    <td className="py-3 pr-3 font-medium text-foreground">
                      <p>{file.name || file.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{file.id}</p>
                    </td>
                    <td className="py-3 pr-3">{formatBytes(file.size)}</td>
                    <td className="py-3 pr-3">{formatDate(file.createdTime)}</td>
                    <td className="py-3 pr-3">
                      {file.webViewLink ? (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          Mở file
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRestore(file)}
                        disabled={busy || isRowBusy}
                      >
                        {isRowBusy ? "Đang khôi phục..." : "Khôi phục"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {files.length === 0 && (
          <SectionLoader label="Chưa có file backup phù hợp trong thư mục Google Drive." />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            value={pageToken}
            onChange={(event) => setPageToken(event.target.value.trim())}
            placeholder="Nhập pageToken để xem trang khác (nếu cần)"
            className="max-w-md"
          />
          {nextPageToken && (
            <Button variant="outline" onClick={() => setPageToken(nextPageToken)}>
              Trang kế tiếp
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
