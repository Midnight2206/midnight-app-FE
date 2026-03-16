import { Card } from "@/components/ui/card";
import { formatMilitaryTypeList } from "../typeUtils";

function formatGender(value) {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "MALE") return "Nam";
  if (normalized === "FEMALE") return "Nữ";
  return "-";
}

export default function MilitaryChangeTable({
  title,
  rows,
  yearField,
  emptyMessage,
}) {
  return (
    <Card className="surface overflow-hidden">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="data-table-wrap border-0 rounded-none">
        <table className="data-table min-w-[1200px]">
          <thead>
            <tr>
              <th>Mã quân nhân</th>
              <th>Họ tên</th>
              <th>Cấp bậc</th>
              <th>Giới tính</th>
              <th>Loại</th>
              <th>Năm PH, CCĐ lần đầu</th>
              <th>Chức vụ</th>
              <th>Đơn vị</th>
              <th>{yearField === "unitTransferInYear" ? "Năm chuyển đến" : "Năm chuyển đi"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((military) => (
                <tr key={`${yearField}-${military.id}`}>
                  <td>{military.militaryCode || "-"}</td>
                  <td>{military.fullname || "-"}</td>
                  <td>{military.rank || "-"}</td>
                  <td>{formatGender(military.gender)}</td>
                  <td>{formatMilitaryTypeList(military.types?.length ? military.types : military.type)}</td>
                  <td>{military.initialCommissioningYear || "-"}</td>
                  <td>{military.position || "-"}</td>
                  <td>{military.assignedUnit || "-"}</td>
                  <td>{military[yearField] || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
