import { Button } from "@/components/ui/button";

export default function MilitaryTransferActionCell({
  military,
  isSubmitting,
  onUndo,
  onOpenCut,
}) {
  const yearState = military?.yearState || null;
  const requestTransferState =
    yearState?.isHasReqTransfer ?? military?.isHasReqTransfer ?? false;
  const displayStatus = yearState?.displayStatus || military?.displayStatus || null;
  const canCutFromHelper =
    typeof yearState?.canCut === "boolean"
      ? yearState.canCut
      : typeof military?.canCut === "boolean"
        ? military.canCut
        : null;

  const pendingInSelectedYear = requestTransferState === "waiting";
  const acceptedInSelectedYear = displayStatus === "transferred";

  const canCutInSelectedYear =
    typeof canCutFromHelper === "boolean" ? canCutFromHelper : false;
  const matchedRequestId = yearState?.matchedRequest?.id || null;

  if (pendingInSelectedYear) {
    return (
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={() => matchedRequestId && onUndo(matchedRequestId)}
        disabled={isSubmitting || !matchedRequestId}
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

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => onOpenCut(military)}
      disabled={isSubmitting || !canCutInSelectedYear}
    >
      Cắt bảo đảm
    </Button>
  );
}
