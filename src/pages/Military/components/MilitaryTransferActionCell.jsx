import { Button } from "@/components/ui/button";

function toSafeYear(value) {
  const year = Number(value || 0);
  return Number.isFinite(year) ? year : 0;
}

export default function MilitaryTransferActionCell({
  military,
  selectedYear,
  currentAdminUnitId,
  isSubmitting,
  onUndo,
  onOpenCut,
}) {
  const pendingTransferYear = toSafeYear(military?.pendingTransferRequest?.transferYear);
  const acceptedTransferYear = toSafeYear(military?.acceptedTransferRequest?.transferYear);
  const transferOutYear = toSafeYear(military?.unitTransferOutYear);

  const pendingInSelectedYear =
    Boolean(military?.pendingTransferRequest) &&
    pendingTransferYear > 0 &&
    pendingTransferYear <= Number(selectedYear);

  const acceptedInSelectedYear =
    military?.acceptedTransferRequest?.status === "ACCEPTED" &&
    military?.acceptedTransferRequest?.fromUnitId === currentAdminUnitId &&
    acceptedTransferYear > 0 &&
    acceptedTransferYear <= Number(selectedYear);

  const canCutInSelectedYear =
    transferOutYear === 0 || transferOutYear > Number(selectedYear);

  if (pendingInSelectedYear) {
    return (
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={() => onUndo(military.pendingTransferRequest.id)}
        disabled={isSubmitting}
      >
        Hoàn tác
      </Button>
    );
  }

  if (acceptedInSelectedYear) {
    return (
      <span className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
        Đã chuyển
      </span>
    );
  }

  if (!canCutInSelectedYear) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => onOpenCut(military)}
      disabled={isSubmitting}
    >
      Cắt bảo đảm
    </Button>
  );
}
