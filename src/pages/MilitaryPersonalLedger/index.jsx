import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRightLeft,
  CalendarDays,
  FileText,
  ShieldAlert,
  ShieldCheck,
  UserSquare2,
} from "lucide-react";
import { toast } from "sonner";

import { PageLoader, SectionLoader } from "@/components/AppLoading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDownloadAllocationModeBaselineTemplateMutation,
  useGetMilitaryPersonalLedgerQuery,
  useGetMilitaryAssignedUnitsQuery,
  useGetMyPersonalLedgerQuery,
  useImportAllocationModeBaselineTemplateMutation,
  useUpdateMilitaryFromPersonalLedgerMutation,
} from "@/features/military/militaryApi";
import { ACCESS_RULES, canAccessByRule } from "@/features/auth/authorization";
import { getApiErrorMessage } from "@/utils/apiError";

const MILITARY_RANK_OPTIONS = [
  { code: "THIEU_UY", label: "Thiếu úy" },
  { code: "TRUNG_UY", label: "Trung úy" },
  { code: "THUONG_UY", label: "Thượng úy" },
  { code: "DAI_UY", label: "Đại úy" },
  { code: "THIEU_TA", label: "Thiếu tá" },
  { code: "TRUNG_TA", label: "Trung tá" },
  { code: "THUONG_TA", label: "Thượng tá" },
  { code: "DAI_TA", label: "Đại tá" },
  { code: "THIEU_TUONG", label: "Thiếu tướng" },
  { code: "TRUNG_TUONG", label: "Trung tướng" },
  { code: "THUONG_TUONG", label: "Thượng tướng" },
  { code: "DAI_TUONG", label: "Đại tướng" },
  { code: "BINH_NHI", label: "Binh nhì" },
  { code: "BINH_NHAT", label: "Binh nhất" },
  { code: "HA_SI", label: "Hạ sĩ" },
  { code: "TRUNG_SI", label: "Trung sĩ" },
  { code: "THUONG_SI", label: "Thượng sĩ" },
];

function downloadBlob(rawData, fileName) {
  const blob = rawData instanceof Blob ? rawData : new Blob([rawData]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatYear(value) {
  return Number.isInteger(Number(value)) ? String(value) : "-";
}

function FilterField({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function StatusBadge({ active, children }) {
  return active ? (
    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{children}</Badge>
  ) : (
    <Badge variant="secondary">{children}</Badge>
  );
}

function SummaryCard({ label, value, tone = "default" }) {
  const toneClassName =
    tone === "danger"
      ? "text-rose-600"
      : tone === "success"
        ? "text-emerald-600"
        : "text-foreground";

  return (
    <Card className="surface p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClassName}`}>{value}</div>
    </Card>
  );
}

function AdminField({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AdminMilitaryEditor({
  military,
  assignedUnits = [],
  onSubmit,
  isSaving,
}) {
  const [form, setForm] = useState(() => ({
    fullname: military?.fullname || "",
    militaryCode: military?.militaryCode || "",
    rank: military?.rankCode || military?.rank || "",
    position: military?.position || "",
    gender: military?.gender || "MALE",
    assignedUnitId: military?.assignedUnitId ? String(military.assignedUnitId) : "",
    initialCommissioningYear: military?.initialCommissioningYear
      ? String(military.initialCommissioningYear)
      : "",
  }));

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Chỉnh sửa quân nhân</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin được sửa các thông tin hồ sơ, trừ `id`, đơn vị gốc và loại quân nhân.
          </p>
        </div>
        <Button onClick={() => onSubmit(form)} disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AdminField label="ID" hint="Không thể thay đổi">
          <Input value={military?.id || ""} disabled readOnly />
        </AdminField>
        <AdminField label="Đơn vị" hint="Không thể thay đổi">
          <Input value={military?.unit?.name || ""} disabled readOnly />
        </AdminField>
        <AdminField label="Mã quân nhân">
          <Input
            value={form.militaryCode}
            onChange={(event) => handleChange("militaryCode", event.target.value)}
          />
        </AdminField>
        <AdminField label="Họ tên">
          <Input
            value={form.fullname}
            onChange={(event) => handleChange("fullname", event.target.value)}
          />
        </AdminField>
        <AdminField label="Cấp bậc">
          <select
            value={form.rank}
            onChange={(event) => handleChange("rank", event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Chọn cấp bậc</option>
            {MILITARY_RANK_OPTIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Giới tính">
          <select
            value={form.gender}
            onChange={(event) => handleChange("gender", event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
        </AdminField>
        <AdminField label="Chức vụ">
          <Input
            value={form.position}
            onChange={(event) => handleChange("position", event.target.value)}
          />
        </AdminField>
        <AdminField label="Đơn vị quản lý">
          <select
            value={form.assignedUnitId}
            onChange={(event) => handleChange("assignedUnitId", event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Không gán</option>
            {assignedUnits.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Năm PH, CCĐ lần đầu">
          <Input
            type="number"
            min={1900}
            max={2100}
            value={form.initialCommissioningYear}
            onChange={(event) =>
              handleChange("initialCommissioningYear", event.target.value)
            }
          />
        </AdminField>
        <div className="space-y-1.5 md:col-span-2 xl:col-span-3">
          <label className="text-sm font-medium">Loại quân nhân</label>
          <div className="rounded-xl border border-border/70 p-3">
            {(military?.types || []).length ? (
              <div className="flex flex-wrap gap-2">
                {military.types.map((type) => (
                  <Badge key={type.id} variant="outline">
                    {[type.code, type.name].filter(Boolean).join(" - ")}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Chưa có danh mục loại quân nhân.</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AdminBaselineImportCard({
  unitName,
  importFile,
  onFileChange,
  onDownload,
  onImport,
  isDownloading,
  isImporting,
}) {
  return (
    <Card className="surface p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="font-semibold">Import năm cấp phát gần nhất theo chế độ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dùng file mẫu của đơn vị {unitName || "-"} để nhập mốc niên hạn theo từng quân
            nhân, từng type và từng loại quân trang. Để trống năm nếu muốn xóa mốc import.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? "Đang tải mẫu..." : "Tải template import"}
          </Button>
          <Button onClick={onImport} disabled={!importFile || isImporting}>
            {isImporting ? "Đang import..." : "Import mốc niên hạn"}
          </Button>
        </div>
      </div>

      <div className="mt-4 max-w-xl space-y-1.5">
        <label className="text-sm font-medium">Chọn file `.xlsx`</label>
        <Input type="file" accept=".xlsx" onChange={onFileChange} />
        <p className="text-xs text-muted-foreground">
          File sẽ áp dụng cho toàn bộ quân nhân trong đơn vị của mẫu template.
        </p>
      </div>
    </Card>
  );
}

function StandardLedgerTable({ rows = [], asOfYear }) {
  return (
    <Card className="surface overflow-hidden">
      <div className="border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Sổ quân trang theo tiêu chuẩn</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi từng quân trang, định mức năm {asOfYear} và trạng thái niên hạn hiện tại.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          Chưa có dòng tiêu chuẩn phù hợp cho quân nhân này ở năm đang xét.
        </div>
      ) : (
        <div className="data-table-wrap border-0 rounded-none">
          <table className="data-table min-w-[1280px]">
            <thead>
              <tr>
                <th>Danh sách</th>
                <th>Danh mục</th>
                <th>Quân trang</th>
                <th>Định mức năm</th>
                <th>Đã cấp năm nay</th>
                <th>Còn lại</th>
                <th>Niên hạn</th>
                <th>Lần cấp gần nhất</th>
                <th>Đủ niên hạn</th>
                <th>Phiếu liên quan</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.subject?.name || "-"}</td>
                  <td>{row.category?.name || "-"}</td>
                  <td>
                    <div className="font-medium">{row.item?.name || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {[row.item?.code, row.item?.unitOfMeasure?.name].filter(Boolean).join(" • ") ||
                        "-"}
                    </div>
                  </td>
                  <td>{row.annualQuota}</td>
                  <td>{row.issuedInCurrentYear}</td>
                  <td>{row.remainingInCurrentYear}</td>
                  <td>{row.serviceLifeYears ? `${row.serviceLifeYears} năm` : "Không giới hạn"}</td>
                  <td>{row.lastIssuedYear || "Chưa có"}</td>
                  <td>
                    <StatusBadge active={row.isDue}>
                      {row.isDue ? "Đã đến hạn" : "Chưa đến hạn"}
                    </StatusBadge>
                  </td>
                  <td>{row.relatedVoucherCount}</td>
                  <td>
                    <div className="max-w-[240px] text-sm">{row.statusText}</div>
                    {row.appliedType ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Loại áp dụng: {[row.appliedType.code, row.appliedType.name]
                          .filter(Boolean)
                          .join(" - ")}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ModeLedgerTable({ rows = [], asOfYear }) {
  return (
    <Card className="surface overflow-hidden">
      <div className="border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Chế độ cấp phát đang áp dụng</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Các chế độ hiện hành của quân nhân và trạng thái đủ niên hạn ở năm {asOfYear}.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          Chưa có chế độ cấp phát đang áp dụng cho quân nhân này.
        </div>
      ) : (
        <div className="data-table-wrap border-0 rounded-none">
          <table className="data-table min-w-[1280px]">
            <thead>
              <tr>
                <th>Chế độ</th>
                <th>Danh mục</th>
                <th>Số lượng theo chế độ</th>
                <th>Đã cấp năm nay</th>
                <th>Còn lại</th>
                <th>Niên hạn</th>
                <th>Lần cấp gần nhất</th>
                <th>Đủ niên hạn</th>
                <th>Phiếu liên quan</th>
                <th>Ghi chú áp dụng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>
                    <div className="font-medium">{row.mode?.name || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {[row.mode?.code, row.appliedType?.code, row.appliedType?.name]
                        .filter(Boolean)
                        .join(" • ") || "-"}
                    </div>
                  </td>
                  <td>{row.category?.name || "-"}</td>
                  <td>{row.configuredQuantity}</td>
                  <td>{row.issuedInCurrentYear}</td>
                  <td>{row.remainingInCurrentYear}</td>
                  <td>{row.serviceLifeYears ? `${row.serviceLifeYears} năm` : "Không giới hạn"}</td>
                  <td>{row.lastIssuedYear || "Chưa có"}</td>
                  <td>
                    <StatusBadge active={row.isDue}>
                      {row.isDue ? "Đã đến hạn" : "Chưa đến hạn"}
                    </StatusBadge>
                  </td>
                  <td>{row.relatedVoucherCount}</td>
                  <td>
                    <div className="max-w-[260px] text-sm">{row.statusText}</div>
                    {row.ruleReason ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.ruleReason}
                      </div>
                    ) : null}
                    {row.importedBaselineYear ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Mốc import gần nhất: {row.importedBaselineYear}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function TransferHistorySection({ groups = [] }) {
  return (
    <Card className="surface overflow-hidden">
      <div className="border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Lịch sử chuyển đến, chuyển đi</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi quá trình bảo đảm quân trang theo từng loại quân nhân.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          Chưa có dữ liệu điều chuyển quân trang trong phạm vi bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {groups.map((group) => (
            <div key={group.key} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="font-semibold">
                  {group.type
                    ? [group.type.code, group.type.name].filter(Boolean).join(" - ")
                    : "Lịch sử chung chưa gắn type"}
                </div>
                <Badge variant={group.isLegacyShared ? "secondary" : "outline"}>
                  {group.periods.length} giai đoạn
                </Badge>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/70">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left">Đơn vị bảo đảm</th>
                      <th className="px-3 py-2 text-left">Nguồn đến</th>
                      <th className="px-3 py-2 text-left">Từ năm</th>
                      <th className="px-3 py-2 text-left">Đến năm</th>
                      <th className="px-3 py-2 text-left">Đích đi</th>
                      <th className="px-3 py-2 text-left">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.periods.map((period) => (
                      <tr key={period.id} className="border-t border-border/70">
                        <td className="px-3 py-2 font-medium">{period.unit?.name || "-"}</td>
                        <td className="px-3 py-2">{period.sourceUnitName || "-"}</td>
                        <td className="px-3 py-2">{period.transferInYear || "-"}</td>
                        <td className="px-3 py-2">{period.transferOutYear || "Nay"}</td>
                        <td className="px-3 py-2">{period.destinationUnitName || "-"}</td>
                        <td className="px-3 py-2">
                          <StatusBadge active={period.isCurrent}>
                            {period.isCurrent ? "Đang bảo đảm" : "Đã chuyển"}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TimelineSection({ groups = [] }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.year} className="surface p-4">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Năm {group.year}</h2>
            <Badge variant="outline">{group.vouchers.length} phiếu</Badge>
          </div>

          <div className="space-y-3">
            {group.vouchers.map((voucher) => (
              <div
                key={`${voucher.type}:${voucher.id}`}
                className="rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{voucher.voucherNo}</span>
                      <Badge variant={voucher.type === "MODE" ? "default" : "secondary"}>
                        {voucher.type === "MODE" ? "Phiếu theo chế độ" : "Phiếu theo tiêu chuẩn"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {voucher.source?.name || "Không rõ nguồn"} • {formatDateTime(voucher.issuedAt)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Người nhận: {voucher.receiverName || "-"} • Kho:{" "}
                      {voucher.warehouse?.name || "-"}
                    </div>
                    {voucher.note ? (
                      <div className="text-sm text-muted-foreground">
                        Ghi chú: {voucher.note}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-border/70">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-3 py-2 text-left">Danh mục</th>
                        <th className="px-3 py-2 text-left">Chi tiết</th>
                        <th className="px-3 py-2 text-left">Số lượng</th>
                        <th className="px-3 py-2 text-left">Niên hạn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(voucher.items || []).map((item) => (
                        <tr key={item.id} className="border-t border-border/70">
                          <td className="px-3 py-2">{item.categoryName || "-"}</td>
                          <td className="px-3 py-2">
                            {[
                              item.itemName,
                              item.versionName,
                              item.colorName,
                              item.appliedType?.code,
                            ]
                              .filter(Boolean)
                              .join(" • ") || "-"}
                          </td>
                          <td className="px-3 py-2">
                            {item.quantity} {item.unitOfMeasureName || ""}
                          </td>
                          <td className="px-3 py-2">
                            {item.serviceLifeYears ? `${item.serviceLifeYears} năm` : "Không giới hạn"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function MilitaryPersonalLedgerPage() {
  const { militaryId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const currentYear = new Date().getFullYear();
  const isSelfRoute = !militaryId || militaryId === "me";
  const canAccessMilitaryPage = canAccessByRule(user, ACCESS_RULES.militaryPage);
  const shouldEnableAdminTools = !isSelfRoute && canAccessMilitaryPage;

  const [draftFilters, setDraftFilters] = useState({
    asOfYear: String(currentYear),
    yearFrom: "",
    yearTo: "",
  });
  const [filters, setFilters] = useState({
    asOfYear: currentYear,
    yearFrom: undefined,
    yearTo: undefined,
  });
  const [importFile, setImportFile] = useState(null);

  const queryParams = {
    asOfYear: Number.parseInt(draftFilters.asOfYear, 10) || currentYear,
    ...(draftFilters.yearFrom.trim()
      ? { yearFrom: Number.parseInt(draftFilters.yearFrom, 10) }
      : {}),
    ...(draftFilters.yearTo.trim()
      ? { yearTo: Number.parseInt(draftFilters.yearTo, 10) }
      : {}),
  };

  const selfLedgerQuery = useGetMyPersonalLedgerQuery(filters, {
    skip: !isSelfRoute,
  });
  const militaryLedgerQuery = useGetMilitaryPersonalLedgerQuery(
    {
      militaryId,
      ...filters,
    },
    {
      skip: isSelfRoute || !militaryId,
    },
  );

  const queryState = isSelfRoute ? selfLedgerQuery : militaryLedgerQuery;
  const { data, isLoading, isFetching, error, refetch } = queryState;
  const { data: assignedUnitsData } = useGetMilitaryAssignedUnitsQuery(
    { unitId: data?.military?.unit?.id },
    {
      skip: !shouldEnableAdminTools || !data?.military?.unit?.id,
    },
  );
  const [updateMilitaryFromPersonalLedger, { isLoading: isSavingMilitary }] =
    useUpdateMilitaryFromPersonalLedgerMutation();
  const [downloadAllocationModeBaselineTemplate, { isLoading: isDownloadingBaselineTemplate }] =
    useDownloadAllocationModeBaselineTemplateMutation();
  const [importAllocationModeBaselineTemplate, { isLoading: isImportingBaselineTemplate }] =
    useImportAllocationModeBaselineTemplateMutation();

  const handleApplyFilters = () => {
    setFilters(queryParams);
  };

  const handleResetFilters = () => {
    setDraftFilters({
      asOfYear: String(currentYear),
      yearFrom: "",
      yearTo: "",
    });
    setFilters({
      asOfYear: currentYear,
      yearFrom: undefined,
      yearTo: undefined,
    });
  };

  const handleSaveMilitary = async (editForm) => {
    if (!militaryId) return;

    try {
      const initialCommissioningYear = Number.parseInt(
        editForm.initialCommissioningYear,
        10,
      );
      if (!Number.isInteger(initialCommissioningYear)) {
        toast.error("Năm PH, CCĐ lần đầu không hợp lệ.");
        return;
      }
      await updateMilitaryFromPersonalLedger({
        militaryId,
        fullname: editForm.fullname.trim(),
        militaryCode: editForm.militaryCode.trim(),
        rank: editForm.rank,
        position: editForm.position.trim(),
        gender: editForm.gender,
        assignedUnitId: editForm.assignedUnitId ? Number(editForm.assignedUnitId) : null,
        initialCommissioningYear,
      }).unwrap();
      toast.success("Đã cập nhật thông tin quân nhân.");
    } catch (submitError) {
      toast.error(
        getApiErrorMessage(submitError, "Không thể cập nhật thông tin quân nhân."),
      );
    }
  };

  const handleDownloadBaselineTemplate = async () => {
    try {
      const rawData = await downloadAllocationModeBaselineTemplate({
        unitId: data?.military?.unit?.id,
      }).unwrap();
      downloadBlob(
        rawData,
        `allocation-mode-baseline-template-unit-${data?.military?.unit?.id || "current"}.xlsx`,
      );
      toast.success("Đã tải template import niên hạn theo chế độ.");
    } catch (downloadError) {
      toast.error(
        getApiErrorMessage(downloadError, "Không tải được template import."),
      );
    }
  };

  const handleImportBaselineTemplate = async () => {
    if (!importFile) {
      toast.error("Vui lòng chọn file import.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const result = await importAllocationModeBaselineTemplate({
        militaryId,
        formData,
      }).unwrap();
      const payload = result?.data || result;
      toast.success(
        `Import hoàn tất: ${payload?.createdRows || 0} tạo mới, ${payload?.updatedRows || 0} cập nhật, ${payload?.clearedRows || 0} xóa mốc.`,
      );
      setImportFile(null);
      await refetch();
    } catch (importError) {
      toast.error(
        getApiErrorMessage(importError, "Import mốc niên hạn thất bại."),
      );
    }
  };

  if (isLoading) {
    return (
      <PageLoader
        title="Đang tải sổ quân trang cá nhân..."
        description="Hệ thống đang tổng hợp tiêu chuẩn, chế độ và lịch sử cấp phát."
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <SectionLoader
          label={getApiErrorMessage(error, "Không tải được sổ quân trang cá nhân.")}
          textClassName="text-destructive"
        />
        <Button onClick={() => refetch()} variant="outline">
          Tải lại
        </Button>
      </div>
    );
  }

  const military = data?.military || null;
  const subjectMemberships = Array.isArray(data?.subjectMemberships) ? data.subjectMemberships : [];
  const transferHistory = Array.isArray(data?.transferHistory) ? data.transferHistory : [];
  const standardBook = Array.isArray(data?.standardBook) ? data.standardBook : [];
  const modeBook = Array.isArray(data?.modeBook) ? data.modeBook : [];
  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
  const summary = data?.summary || {};
  const assignedUnits = Array.isArray(assignedUnitsData?.assignedUnits)
    ? assignedUnitsData.assignedUnits
    : Array.isArray(assignedUnitsData)
      ? assignedUnitsData
      : [];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Card className="surface p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Sổ quân trang cá nhân</Badge>
              {data?.access?.isSelf ? (
                <Badge className="bg-primary text-primary-foreground">Tự xem</Badge>
              ) : (
                <Badge variant="secondary">Quản trị đơn vị</Badge>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">
                {military?.fullname || "Quân nhân"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Theo dõi đầy đủ quân trang, chế độ cấp phát, trạng thái niên hạn và các phiếu
                liên quan qua nhiều năm.
              </p>
            </div>
          </div>

        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FilterField
            label="Năm xét niên hạn"
            value={draftFilters.asOfYear}
            onChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, asOfYear: value }))
            }
            placeholder="2026"
          />
          <FilterField
            label="Lịch sử từ năm"
            value={draftFilters.yearFrom}
            onChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, yearFrom: value }))
            }
            placeholder="Để trống nếu lấy toàn bộ"
          />
          <FilterField
            label="Lịch sử đến năm"
            value={draftFilters.yearTo}
            onChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, yearTo: value }))
            }
            placeholder="Để trống nếu lấy toàn bộ"
          />
          <div className="flex flex-col justify-end gap-2">
            <Button onClick={handleApplyFilters} disabled={isFetching}>
              Áp dụng bộ lọc
            </Button>
            <Button variant="outline" onClick={handleResetFilters} disabled={isFetching}>
              Đặt lại
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Danh sách cấp phát đang thuộc" value={summary.activeSubjects || 0} />
        <SummaryCard
          label="Dòng tiêu chuẩn đến hạn"
          value={summary.dueStandardRows || 0}
          tone={Number(summary.dueStandardRows || 0) > 0 ? "danger" : "success"}
        />
        <SummaryCard
          label="Dòng chế độ đến hạn"
          value={summary.dueModeRows || 0}
          tone={Number(summary.dueModeRows || 0) > 0 ? "danger" : "success"}
        />
        <SummaryCard label="Phiếu liên quan" value={summary.totalRelatedVouchers || 0} />
        <SummaryCard
          label="Tổng dòng sổ"
          value={Number(summary.totalStandardRows || 0) + Number(summary.totalModeRows || 0)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
        <Card className="surface p-4">
          <div className="flex items-center gap-2">
            <UserSquare2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Thông tin quân nhân</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Mã quân nhân</div>
              <div className="mt-1 font-medium">{military?.militaryCode || "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Đơn vị</div>
              <div className="mt-1 font-medium">{military?.unit?.name || "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Cấp bậc</div>
              <div className="mt-1 font-medium">{military?.rank || "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Chức vụ</div>
              <div className="mt-1 font-medium">{military?.position || "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Assigned unit</div>
              <div className="mt-1 font-medium">{military?.assignedUnit || "-"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Năm PH, CCĐ lần đầu</div>
              <div className="mt-1 font-medium">
                {formatYear(military?.initialCommissioningYear)}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs uppercase text-muted-foreground">Loại quân nhân</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(military?.types || []).length ? (
                  military.types.map((type) => (
                    <Badge key={type.id} variant="outline">
                      {[type.code, type.name].filter(Boolean).join(" - ")}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Chưa có loại quân nhân</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="surface p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Danh sách cấp phát đang/đã thuộc</h2>
          </div>
          <div className="mt-4 space-y-3">
            {subjectMemberships.length ? (
              subjectMemberships.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{entry.subject?.name || "-"}</div>
                    <StatusBadge active={entry.isActiveAtAsOfYear}>
                      {entry.isActiveAtAsOfYear ? "Đang thuộc" : "Đã chuyển"}
                    </StatusBadge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Từ {entry.transferInYear} đến {entry.transferOutYear || "nay"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu danh sách cấp phát của quân nhân này.
              </div>
            )}
          </div>
        </Card>
      </div>

      {shouldEnableAdminTools ? (
        <div className="space-y-4">
          <AdminMilitaryEditor
            key={[
              military?.id,
              military?.militaryCode,
              military?.fullname,
              military?.assignedUnitId,
              military?.initialCommissioningYear,
              ...(military?.types || []).map((type) => type.id),
            ].join(":")}
            military={military}
            assignedUnits={assignedUnits}
            onSubmit={handleSaveMilitary}
            isSaving={isSavingMilitary}
          />
          <AdminBaselineImportCard
            unitName={military?.unit?.name}
            importFile={importFile}
            onFileChange={(event) => setImportFile(event.target.files?.[0] || null)}
            onDownload={handleDownloadBaselineTemplate}
            onImport={handleImportBaselineTemplate}
            isDownloading={isDownloadingBaselineTemplate}
            isImporting={isImportingBaselineTemplate}
          />
        </div>
      ) : null}

      <TransferHistorySection groups={transferHistory} />
      <StandardLedgerTable rows={standardBook} asOfYear={filters.asOfYear} />
      <ModeLedgerTable rows={modeBook} asOfYear={filters.asOfYear} />

      <Card className="surface p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Lịch sử phiếu cấp phát theo năm</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Bao gồm toàn bộ phiếu tiêu chuẩn và phiếu theo chế độ đã gắn với quân nhân này.
        </p>
      </Card>

      {timeline.length ? (
        <TimelineSection groups={timeline} />
      ) : (
        <Card className="surface p-6 text-sm text-muted-foreground">
          Chưa có phiếu cấp phát nào trong phạm vi bộ lọc hiện tại.
        </Card>
      )}

      {isFetching ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
          <ShieldAlert className="h-4 w-4" />
          Đang cập nhật dữ liệu sổ quân trang...
        </div>
      ) : null}
    </div>
  );
}
