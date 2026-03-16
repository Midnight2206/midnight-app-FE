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

export default function ResetPasswordDialog({
  resetModal,
  setResetModal,
  onClose,
  onConfirm,
  isResettingPassword,
}) {
  return (
    <Dialog open={resetModal.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset mật khẩu tài khoản</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu mới cho tài khoản <b>{resetModal.username}</b>.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="Mật khẩu mới (>= 8 ký tự)"
          value={resetModal.newPassword}
          onChange={(e) =>
            setResetModal((prev) => ({ ...prev, newPassword: e.target.value }))
          }
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={isResettingPassword}>
            {isResettingPassword ? "Đang xử lý..." : "Xác nhận reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

