import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TransferItemsModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Luong kho va mat hang da duoc go bo.</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
