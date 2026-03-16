import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLoader } from "@/components/AppLoading";

export default function IncomingTransferRequestsPanel({
  selectedYear,
  requests,
  isLoading,
  isFetching,
  isAccepting,
  onAccept,
}) {
  return (
    <Card className="surface p-4 md:p-5 space-y-3">
      <h3 className="text-base font-semibold">Yêu cầu nhận bảo đảm trong năm {selectedYear}</h3>
      <p className="text-xs text-muted-foreground">
        Nút nhận bảo đảm chỉ hiển thị tại tab Quân nhân tăng.
      </p>
      {isLoading || isFetching ? (
        <SectionLoader label="Đang tải yêu cầu chuyển đến..." />
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Không có yêu cầu nhận bảo đảm trong năm {selectedYear}.
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div key={request.id} className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">
                {request.military?.fullname} ({request.military?.militaryCode})
              </p>
              <p className="text-xs text-muted-foreground">
                Từ: {request.fromUnit?.name || "-"} | Đến: {request.toUnit?.name || "-"} | Năm:{" "}
                {request.transferYear}
              </p>
              {request.note ? (
                <p className="text-xs text-muted-foreground">Ghi chú: {request.note}</p>
              ) : null}
              <Button
                size="sm"
                onClick={() => onAccept(request.id)}
                disabled={isAccepting}
              >
                Nhận bảo đảm
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

