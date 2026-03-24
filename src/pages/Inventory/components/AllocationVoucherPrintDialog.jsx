import { useMemo, useRef, useState } from "react";
import { Printer, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetAllocationModeVoucherTemplateQuery,
  useSaveAllocationModeVoucherTemplateMutation,
} from "@/features/inventory/inventoryApi";
import {
  ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE_TYPE,
  getDefaultAllocationModeIssueVoucherTemplate,
  normalizeAllocationModeIssueVoucherTemplate,
  normalizeSignatureSubtitle,
  normalizeSignatureWidthPercent,
  normalizeSignatureWidthPercents,
  rebalanceSignatureWidthPercents,
  SIGNATURE_SUBTITLE_MAX_CHARS_PER_LINE,
  SIGNATURE_WIDTH_PERCENT_MIN,
  SIGNATURE_WIDTH_PERCENT_STEP,
  SIGNATURE_WIDTH_PERCENT_TOTAL,
} from "@/features/print-templates/allocationModeIssueVoucherTemplate";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getVietnamDateParts(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);

  return {
    day: parts.find((part) => part.type === "day")?.value || "",
    month: parts.find((part) => part.type === "month")?.value || "",
    year: parts.find((part) => part.type === "year")?.value || "",
  };
}

function formatCurrentVietnamDateLine() {
  const { day, month, year } = getVietnamDateParts();
  return `Ngày ${day} tháng ${month} năm ${year}`;
}

function getCreatorDisplayName(voucher) {
  return (
    voucher?.createdBy?.displayName ||
    voucher?.createdBy?.username ||
    ""
  );
}

function resolveSignatureName(signature, index, voucher) {
  if (index === 1) return voucher?.receiverName || "";
  if (signature?.signerName) return signature.signerName;
  if (index === 0) return getCreatorDisplayName(voucher);
  return "";
}

function buildReason(voucher) {
  if (voucher?.reason) {
    return voucher.reason;
  }

  const parts = [];
  if (voucher?.military?.fullname) {
    parts.push(`Cấp phát cho ${voucher.military.fullname}`);
  }
  if (voucher?.military?.militaryCode) {
    parts.push(`Số quân nhân: ${voucher.military.militaryCode}`);
  }
  if (voucher?.mode?.name) {
    parts.push(`Theo chế độ ${voucher.mode.name}`);
  }
  if (voucher?.note) {
    parts.push(voucher.note);
  }
  return parts.join(" - ");
}

function buildItemDisplay(item) {
  return [
    item?.categoryName || item?.category?.name || "",
    item?.versionName && item.versionName !== "None" ? item.versionName : null,
    item?.colorName && item.colorName !== "None" ? item.colorName : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

function getSignatureWidthStyle(signature) {
  const widthPercent = normalizeSignatureWidthPercent(signature?.widthPercent);
  return {
    flex: `${widthPercent} 0 0`,
    maxWidth: `${widthPercent}%`,
    minWidth: 0,
  };
}

function getSignatureSubtitleLines(subtitle) {
  const lines = normalizeSignatureSubtitle(subtitle).split("\n");
  return lines.length ? lines : [""];
}

function getMaxSignatureSubtitleLines(signatures = []) {
  return Math.max(
    1,
    ...signatures.map((signature) =>
      getSignatureSubtitleLines(signature?.subtitle).length,
    ),
  );
}

function getPaddedSignatureSubtitleLines(signature, maxLines) {
  const lines = getSignatureSubtitleLines(signature?.subtitle);
  return [
    ...lines,
    ...Array(Math.max(0, maxLines - lines.length)).fill(""),
  ];
}

function getVoucherTemplateConfig(voucher) {
  return voucher?.printTemplate?.config
    ? normalizeAllocationModeIssueVoucherTemplate(voucher.printTemplate.config)
    : null;
}

function buildTemplateOptionLabel({
  isAttached = false,
  isActive = false,
  versionNo = null,
}) {
  const versionLabel = versionNo ? `v${versionNo}` : "chưa đánh số";

  if (isAttached && isActive) {
    return `Phiếu đang gắn ${versionLabel} • cũng là phiên bản hiện hành`;
  }

  if (isAttached) {
    return `Phiếu đang gắn ${versionLabel}`;
  }

  if (isActive) {
    return `Phiên bản hiện hành ${versionLabel}`;
  }

  return `Phiên bản ${versionLabel}`;
}

function buildTemplateOptions({ voucher, templateResponse }) {
  const options = [];
  const serverVersions = templateResponse?.template?.versions || [];
  const activeVersionId = templateResponse?.template?.currentVersion?.id || null;
  const attachedVersionId = voucher?.printTemplate?.versionId || null;
  const attachedVersionNo = voucher?.printTemplate?.versionNo || null;
  const matchedAttachedVersionId = attachedVersionId
    ? serverVersions.find((version) => version.id === attachedVersionId)?.id || null
    : null;

  for (const version of serverVersions) {
    if (!version?.config) continue;

    options.push({
      key: `version:${version.id}`,
      config: normalizeAllocationModeIssueVoucherTemplate(version.config),
      versionId: version.id,
      versionNo: version.versionNo || null,
      isAttached: Boolean(attachedVersionId && attachedVersionId === version.id),
      isActive: Boolean(activeVersionId && activeVersionId === version.id),
      label: buildTemplateOptionLabel({
        isAttached: attachedVersionId === version.id,
        isActive: activeVersionId === version.id,
        versionNo: version.versionNo || null,
      }),
    });
  }

  if (voucher?.printTemplate?.config && !matchedAttachedVersionId) {
    options.unshift({
      key: attachedVersionId
        ? `attached:${attachedVersionId}`
        : attachedVersionNo
          ? `attached-version-no:${attachedVersionNo}`
          : "attached:snapshot",
      config: getVoucherTemplateConfig(voucher),
      versionId: attachedVersionId,
      versionNo: attachedVersionNo,
      isAttached: true,
      isActive: false,
      label: buildTemplateOptionLabel({
        isAttached: true,
        isActive: false,
        versionNo: attachedVersionNo,
      }),
    });
  }

  if (!options.length) {
    options.push({
      key: "default-template",
      config: getDefaultAllocationModeIssueVoucherTemplate(),
      versionId: null,
      versionNo: null,
      isAttached: false,
      isActive: false,
      label: "Mẫu mặc định",
    });
  }

  return options;
}

function canAdjustSignatureWidth(signatures, index, delta) {
  const currentWidths = normalizeSignatureWidthPercents(signatures);
  if (delta > 0) {
    const available = currentWidths.reduce((sum, value, currentIndex) => {
      if (currentIndex === index) return sum;
      return sum + Math.max(0, value - SIGNATURE_WIDTH_PERCENT_MIN);
    }, 0);
    return available > 0;
  }

  return currentWidths[index] > SIGNATURE_WIDTH_PERCENT_MIN;
}

function PrintableVoucher({ voucher, template }) {
  const dateLine = formatCurrentVietnamDateLine();
  const reasonText = buildReason(voucher);
  const maxSubtitleLines = getMaxSignatureSubtitleLines(template.signatures);

  return (
    <div
      className="mx-auto bg-white text-black shadow-sm"
      style={{
        width: "210mm",
        minHeight: "297mm",
        paddingTop: "1.5cm",
        paddingRight: "1cm",
        paddingBottom: "1.5cm",
        paddingLeft: "2.5cm",
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "12pt",
        lineHeight: 1.35,
      }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1 text-center">
          <div className="font-bold uppercase">
            {template.headerLine1 || voucher?.unit?.name || ""}
          </div>
          <div className="font-bold uppercase">
            {template.headerLine2 || voucher?.warehouse?.name || ""}
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div>{template.formCode}</div>
          <div>
            Số: <span className="font-semibold">{voucher?.voucherNo || ""}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-center">
        <div className="text-xl font-bold uppercase">{template.title}</div>
        <div>{dateLine}</div>
      </div>

      <div className="mt-4 space-y-2">
        <div>
          {template.receiverLabel}:{" "}
          <span className="font-semibold">{voucher?.receiverName || ""}</span>
        </div>
        <div>
          {template.unitLabel}:{" "}
          <span className="font-semibold">
            {voucher?.military?.unit?.name || voucher?.unit?.name || ""}
          </span>
        </div>
        <div>
          {template.reasonLabel}: <span>{reasonText}</span>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse">
        <thead className="bg-white">
          <tr>
            <th className="border border-black px-2 py-2 text-center font-bold">
              TT
            </th>
            <th className="border border-black px-2 py-2 text-center font-bold">
              Tên, quy cách quân trang
            </th>
            <th className="border border-black px-2 py-2 text-center font-bold">
              DVT
            </th>
            <th className="border border-black px-2 py-2 text-center font-bold">
              Số lượng
            </th>
            <th className="border border-black px-2 py-2 text-center font-bold">
              Ghi chú
            </th>
          </tr>
        </thead>
        <tbody>
          {(voucher?.items || []).map((item, index) => (
            <tr key={item.id || `${item.categoryId}-${index}`}>
              <td className="border border-black px-2 py-2 text-center align-top">
                {index + 1}
              </td>
              <td className="border border-black px-2 py-2 align-top">
                {buildItemDisplay(item)}
              </td>
              <td className="border border-black px-2 py-2 text-center align-top">
                {item?.unitOfMeasureName || "-"}
              </td>
              <td className="border border-black px-2 py-2 text-center align-top">
                {Number(item?.quantity || 0).toLocaleString("vi-VN")}
              </td>
              <td className="border border-black px-2 py-2 align-top">
                {item?.wasDue
                  ? "Đã đến niên hạn"
                  : item?.nextEligibleYear
                    ? `Chưa đến niên hạn (${item.nextEligibleYear})`
                    : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className="mt-10 flex items-stretch gap-4 text-center"
        style={{ fontSize: "11pt", lineHeight: 1.35 }}
      >
        {template.signatures.map((signature, index) => (
          <div
            key={`signature-preview-${index}`}
            className="space-y-2 px-3 py-3"
            style={getSignatureWidthStyle(signature)}
          >
            <div className="overflow-hidden text-ellipsis whitespace-nowrap font-bold uppercase">
              {signature.title}
            </div>
            <div className="font-bold not-italic">
              {getPaddedSignatureSubtitleLines(signature, maxSubtitleLines).map(
                (line, lineIndex) => (
                  <div
                    key={`signature-preview-${index}-subtitle-${lineIndex}`}
                    style={{ minHeight: "1.35em", whiteSpace: "nowrap" }}
                    className="overflow-hidden text-ellipsis"
                  >
                    {line || "\u00A0"}
                  </div>
                ),
              )}
            </div>
            <div style={{ height: "72px" }} />
            <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
              {resolveSignatureName(signature, index, voucher) || "\u00A0"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildPrintHtml(voucher, template) {
  const dateLine = formatCurrentVietnamDateLine();
  const reasonText = buildReason(voucher);
  const maxSubtitleLines = getMaxSignatureSubtitleLines(template.signatures);
  const itemsHtml = (voucher?.items || [])
    .map(
      (item, index) => `
        <tr>
          <td class="cell cell-center">${index + 1}</td>
          <td class="cell">${escapeHtml(buildItemDisplay(item))}</td>
          <td class="cell cell-center">${escapeHtml(item?.unitOfMeasureName || "-")}</td>
          <td class="cell cell-center">${escapeHtml(Number(item?.quantity || 0).toLocaleString("vi-VN"))}</td>
          <td class="cell">${
            item?.wasDue
              ? "Đã đến niên hạn"
              : item?.nextEligibleYear
                ? escapeHtml(`Chưa đến niên hạn (${item.nextEligibleYear})`)
                : ""
          }</td>
        </tr>
      `,
    )
    .join("");

  const signaturesHtml = template.signatures
    .map(
      (signature, index) => `
        <div class="signature-block" style="flex: ${normalizeSignatureWidthPercent(signature?.widthPercent)} 0 0; max-width: ${normalizeSignatureWidthPercent(signature?.widthPercent)}%; min-width: 0;">
          <div class="signature-title">${escapeHtml(signature.title)}</div>
          <div class="signature-subtitle">
            ${getPaddedSignatureSubtitleLines(signature, maxSubtitleLines)
              .map(
                (line) =>
                  `<div class="signature-subtitle-line">${escapeHtml(line || "\u00A0")}</div>`,
              )
              .join("")}
          </div>
          <div class="signature-space"></div>
          <div class="signature-name">${escapeHtml(resolveSignatureName(signature, index, voucher) || "")}</div>
        </div>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(voucher?.voucherNo || "Phiếu xuất kho")}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1.5cm 1cm 1.5cm 2.5cm;
          }
          html, body {
            margin: 0;
            color: #000;
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.35;
          }
          .print-page {
            width: 100%;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
          }
          .header-left {
            text-align: center;
          }
          .header-right {
            text-align: right;
          }
          .upper {
            font-weight: 700;
            text-transform: uppercase;
          }
          .title {
            margin-top: 18px;
            text-align: center;
          }
          .title-main {
            font-size: 20pt;
            font-weight: 700;
            text-transform: uppercase;
          }
          .meta {
            margin-top: 12px;
          }
          .meta-row {
            margin: 4px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
          }
          thead {
            display: table-header-group;
          }
          tr, td, th {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .cell {
            border: 1px solid #000;
            padding: 6px 8px;
            vertical-align: top;
          }
          .cell-center {
            text-align: center;
          }
          .signatures {
            margin-top: 36px;
            display: flex;
            gap: 16px;
            text-align: center;
            font-size: 11pt;
            line-height: 1.35;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signature-block {
            padding: 10px 8px;
            box-sizing: border-box;
          }
          .signature-title {
            font-weight: 700;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .signature-subtitle {
            font-style: normal;
            font-weight: 700;
          }
          .signature-subtitle-line {
            min-height: 1.35em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .signature-space {
            height: 72px;
          }
          .signature-name {
            margin-top: 6px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        </style>
      </head>
      <body>
        <div class="print-page">
          <div class="header">
            <div class="header-left">
              <div class="upper">${escapeHtml(
                template.headerLine1 || voucher?.unit?.name || "",
              )}</div>
              <div class="upper">${escapeHtml(
                template.headerLine2 || voucher?.warehouse?.name || "",
              )}</div>
            </div>
            <div class="header-right">
              <div>${escapeHtml(template.formCode)}</div>
              <div>Số: <strong>${escapeHtml(voucher?.voucherNo || "")}</strong></div>
            </div>
          </div>

          <div class="title">
            <div class="title-main">${escapeHtml(template.title)}</div>
            <div>${escapeHtml(dateLine)}</div>
          </div>

          <div class="meta">
            <div class="meta-row">${escapeHtml(template.receiverLabel)}: <strong>${escapeHtml(voucher?.receiverName || "")}</strong></div>
            <div class="meta-row">${escapeHtml(template.unitLabel)}: <strong>${escapeHtml(voucher?.military?.unit?.name || voucher?.unit?.name || "")}</strong></div>
            <div class="meta-row">${escapeHtml(template.reasonLabel)}: ${escapeHtml(reasonText)}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="cell cell-center">TT</th>
                <th class="cell cell-center">Tên, quy cách quân trang</th>
                <th class="cell cell-center">DVT</th>
                <th class="cell cell-center">Số lượng</th>
                <th class="cell cell-center">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="signatures">
            ${signaturesHtml}
          </div>
        </div>
      </body>
    </html>
  `;
}

function AllocationVoucherPrintDialogEditor({
  voucher,
  initialTemplateOptionKey,
  templateOptions,
  attachedTemplateVersion,
  activeTemplateVersion,
  isAttachedTemplateOutdated,
  isFetchingTemplate,
  onSaveTemplate,
  isSavingTemplate,
}) {
  const normalizedTemplateOptions = useMemo(
    () => templateOptions.filter((option) => option?.config),
    [templateOptions],
  );
  const [selectedTemplateOptionKey, setSelectedTemplateOptionKey] = useState(
    () =>
      normalizedTemplateOptions.find((option) => option.key === initialTemplateOptionKey)?.key ||
      normalizedTemplateOptions[0]?.key ||
      "default-template",
  );
  const [template, setTemplate] = useState(() =>
    normalizeAllocationModeIssueVoucherTemplate(
      normalizedTemplateOptions.find((option) => option.key === initialTemplateOptionKey)
        ?.config || normalizedTemplateOptions[0]?.config,
    ),
  );
  const printFrameRef = useRef(null);

  const canPrint = Boolean(voucher);
  const reasonPreview = useMemo(() => buildReason(voucher), [voucher]);
  const activeTemplateOption =
    normalizedTemplateOptions.find(
      (option) => option.key === selectedTemplateOptionKey,
    ) || normalizedTemplateOptions[0];

  const updateTemplate = (patch) => {
    setTemplate((current) => ({
      ...normalizeAllocationModeIssueVoucherTemplate({
        ...current,
        ...patch,
      }),
    }));
  };

  const updateSignature = (index, patch) => {
    setTemplate((current) => ({
      ...current,
      signatures: current.signatures.map((signature, signatureIndex) =>
        signatureIndex === index ? { ...signature, ...patch } : signature,
      ),
    }));
  };

  const adjustSignatureWidth = (index, delta) => {
    setTemplate((current) => {
      const currentWidths = normalizeSignatureWidthPercents(current.signatures);
      const nextWidths = [...currentWidths];
      const targetWidth = nextWidths[index];
      const desiredWidth = normalizeSignatureWidthPercent(targetWidth + delta);
      let remainingIncrease = desiredWidth - targetWidth;

      if (remainingIncrease === 0) return current;

      if (remainingIncrease > 0) {
        const donorIndexes = nextWidths
          .map((value, currentIndex) => ({ value, index: currentIndex }))
          .filter(
            ({ index: currentIndex, value }) =>
              currentIndex !== index && value > SIGNATURE_WIDTH_PERCENT_MIN,
          )
          .sort((left, right) => right.value - left.value)
          .map(({ index: currentIndex }) => currentIndex);

        for (const donorIndex of donorIndexes) {
          if (remainingIncrease <= 0) break;
          const available = nextWidths[donorIndex] - SIGNATURE_WIDTH_PERCENT_MIN;
          const transfer = Math.min(available, remainingIncrease);
          if (transfer <= 0) continue;
          nextWidths[donorIndex] -= transfer;
          remainingIncrease -= transfer;
        }

        const appliedIncrease = desiredWidth - targetWidth - remainingIncrease;
        if (appliedIncrease <= 0) return current;
        nextWidths[index] += appliedIncrease;
      } else {
        let remainingDecrease = Math.min(
          targetWidth - SIGNATURE_WIDTH_PERCENT_MIN,
          Math.abs(remainingIncrease),
        );
        if (remainingDecrease <= 0) return current;

        nextWidths[index] -= remainingDecrease;
        const receiverIndexes = nextWidths
          .map((value, currentIndex) => ({ value, index: currentIndex }))
          .filter(({ index: currentIndex }) => currentIndex !== index)
          .sort((left, right) => left.value - right.value)
          .map(({ index: currentIndex }) => currentIndex);

        while (remainingDecrease > 0) {
          let changed = false;
          for (const receiverIndex of receiverIndexes) {
            if (remainingDecrease <= 0) break;
            nextWidths[receiverIndex] += 1;
            remainingDecrease -= 1;
            changed = true;
          }
          if (!changed) break;
        }
      }

      const balancedWidths = rebalanceSignatureWidthPercents(nextWidths, index);

      return {
        ...current,
        signatures: current.signatures.map((signature, signatureIndex) => ({
          ...signature,
          widthPercent: balancedWidths[signatureIndex],
        })),
      };
    });
  };

  const handleTemplateOptionChange = (nextOptionKey) => {
    const nextOption =
      normalizedTemplateOptions.find((option) => option.key === nextOptionKey) || null;

    if (!nextOption?.config) return;

    setSelectedTemplateOptionKey(nextOption.key);
    setTemplate(normalizeAllocationModeIssueVoucherTemplate(nextOption.config));
  };

  const handleSaveTemplate = async () => {
    const normalizedTemplate =
      normalizeAllocationModeIssueVoucherTemplate(template);

    try {
      const result = await onSaveTemplate({
        templateType: ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE_TYPE,
        config: normalizedTemplate,
      }).unwrap();

      const savedConfig =
        result?.template?.currentVersion?.config
          ? normalizeAllocationModeIssueVoucherTemplate(
              result.template.currentVersion.config,
            )
          : normalizedTemplate;

      setTemplate(savedConfig);
      if (result?.template?.currentVersion?.id) {
        setSelectedTemplateOptionKey(`version:${result.template.currentVersion.id}`);
      }
      toast.success(
        `Đã lưu mẫu in phiên bản v${
          result?.template?.currentVersion?.versionNo || "mới"
        }.`,
      );
    } catch (error) {
      toast.error(error?.data?.message || "Lưu mẫu in thất bại.");
    }
  };

  const handleResetTemplate = () => {
    setTemplate(getDefaultAllocationModeIssueVoucherTemplate());
  };

  const handlePrint = () => {
    if (!voucher) return;
    const iframe = printFrameRef.current;
    const printWindow = iframe?.contentWindow;
    const printDocument = printWindow?.document;
    if (!iframe || !printDocument || !printWindow) return;
    iframe.onload = () => {
      printWindow.focus();
      printWindow.print();
      iframe.onload = null;
    };
    printDocument.open();
    printDocument.write(buildPrintHtml(voucher, template));
    printDocument.close();
  };

  return (
    <>
      <div className="grid max-h-[82vh] gap-4 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="space-y-4 overflow-auto p-4">
          <div className="space-y-1">
            <div className="font-semibold">Cấu hình mẫu in</div>
            <div className="text-sm text-muted-foreground">
              Mẫu này được lưu theo đơn vị trong hệ thống. Mỗi lần lưu sẽ tạo
              một phiên bản mới để các phiếu cũ vẫn in lại đúng mẫu đã dùng.
            </div>
          </div>

          <div className="space-y-1 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
            <div>
              Phiên bản gắn trên phiếu:{" "}
              <span className="font-semibold">
                {attachedTemplateVersion ? `v${attachedTemplateVersion}` : "Chưa có"}
              </span>
            </div>
            <div>
              Phiên bản hiện hành của đơn vị:{" "}
              <span className="font-semibold">
                {activeTemplateVersion ? `v${activeTemplateVersion}` : "Đang khởi tạo"}
              </span>
            </div>
            {isFetchingTemplate ? (
              <div className="text-muted-foreground">Đang tải mẫu in của đơn vị...</div>
            ) : null}
            {isAttachedTemplateOutdated ? (
              <div className="text-muted-foreground">
                Phiếu này đang dùng mẫu cũ. Nếu bạn lưu ở đây, hệ thống sẽ tạo
                phiên bản mới cho các phiếu phát sinh sau này; phiếu hiện tại
                vẫn giữ nguyên mẫu cũ.
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phiên bản dùng để xem trước / in</label>
            <select
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm shadow-sm"
              value={selectedTemplateOptionKey}
              onChange={(event) => handleTemplateOptionChange(event.target.value)}
            >
              {normalizedTemplateOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground">
              {activeTemplateOption?.isAttached
                ? "Bạn đang in theo mẫu gắn trên phiếu."
                : "Bạn có thể chọn bất kỳ phiên bản nào để xem trước hoặc in lại."}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dòng tiêu đề 1</label>
            <Input
              value={template.headerLine1}
              onChange={(event) =>
                updateTemplate({ headerLine1: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dòng tiêu đề 2</label>
            <Input
              value={template.headerLine2}
              onChange={(event) =>
                updateTemplate({ headerLine2: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mã mẫu</label>
            <Input
              value={template.formCode}
              onChange={(event) =>
                updateTemplate({ formCode: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tiêu đề phiếu</label>
            <Input
              value={template.title}
              onChange={(event) =>
                updateTemplate({ title: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nhãn người nhận</label>
            <Input
              value={template.receiverLabel}
              onChange={(event) =>
                updateTemplate({ receiverLabel: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nhãn đơn vị</label>
            <Input
              value={template.unitLabel}
              onChange={(event) =>
                updateTemplate({ unitLabel: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nhãn lý do</label>
            <Input
              value={template.reasonLabel}
              onChange={(event) =>
                updateTemplate({ reasonLabel: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Xem trước lý do</label>
            <Textarea value={reasonPreview} readOnly className="min-h-[88px]" />
          </div>

          {template.signatures.map((signature, index) => (
            <div
              key={`signature-config-${index}`}
              className="space-y-2 rounded-xl border p-3"
            >
              <div className="text-sm font-medium">Chữ ký {index + 1}</div>
              <Input
                value={signature.title}
                onChange={(event) =>
                  updateSignature(index, { title: event.target.value })
                }
                placeholder="Tiêu đề"
              />
              <Textarea
                value={signature.subtitle}
                onChange={(event) =>
                  updateSignature(index, {
                    subtitle: normalizeSignatureSubtitle(event.target.value),
                  })
                }
                placeholder="Dòng phụ, nhấn Enter để thêm dòng"
                className="min-h-[88px]"
              />
              <div className="text-xs text-muted-foreground">
                Tối đa {SIGNATURE_SUBTITLE_MAX_CHARS_PER_LINE} ký tự mỗi dòng.
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Độ rộng khung</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      adjustSignatureWidth(index, -SIGNATURE_WIDTH_PERCENT_STEP)
                    }
                    disabled={!canAdjustSignatureWidth(
                      template.signatures,
                      index,
                      -SIGNATURE_WIDTH_PERCENT_STEP,
                    )}
                  >
                    -
                  </Button>
                  <div className="min-w-14 text-center text-sm font-semibold">
                    {normalizeSignatureWidthPercent(signature.widthPercent)}%
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      adjustSignatureWidth(index, SIGNATURE_WIDTH_PERCENT_STEP)
                    }
                    disabled={!canAdjustSignatureWidth(
                      template.signatures,
                      index,
                      SIGNATURE_WIDTH_PERCENT_STEP,
                    )}
                  >
                    +
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tổng tất cả phần ký luôn bằng {SIGNATURE_WIDTH_PERCENT_TOTAL}%.
                </div>
              </div>
              <Input
                value={index === 1 ? voucher?.receiverName || "" : signature.signerName || ""}
                onChange={(event) =>
                  updateSignature(index, { signerName: event.target.value })
                }
                placeholder={
                  index === 0
                    ? getCreatorDisplayName(voucher) || "Tên người ký"
                    : "Tên người ký"
                }
                disabled={index === 1}
              />
              {index === 1 ? (
                <div className="text-xs text-muted-foreground">
                  Tên người nhận được lấy trực tiếp từ phiếu xuất kho.
                </div>
              ) : null}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate}
            >
              {isSavingTemplate ? "Đang lưu..." : "Lưu thành phiên bản mới"}
            </Button>
            <Button type="button" variant="outline" onClick={handleResetTemplate}>
              Khôi phục mặc định
            </Button>
            <Button type="button" onClick={handlePrint} disabled={!canPrint}>
              In trực tiếp
            </Button>
          </div>
        </Card>

        <div className="overflow-auto rounded-2xl bg-muted/20 p-4">
          <div className="mb-3 text-sm text-muted-foreground">
            Xem trước khổ A4 dọc, font Times New Roman, cỡ 12, lề in:
            trên 1,5 cm, phải 1 cm, dưới 1,5 cm, trái 2,5 cm.
          </div>
          <PrintableVoucher voucher={voucher} template={template} />
        </div>
      </div>

      <iframe
        ref={printFrameRef}
        title="allocation-voucher-print-frame"
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px border-0 opacity-0"
      />
    </>
  );
}

export default function AllocationVoucherPrintDialog({
  voucher,
  triggerLabel = "Xem mẫu in",
  triggerVariant = "outline",
  initialOpen = false,
  open: controlledOpen,
  onOpenChange,
  triggerClassName = "",
  hideTrigger = false,
}) {
  const [internalOpen, setInternalOpen] = useState(initialOpen);
  const { data: templateResponse, isFetching: isFetchingTemplate } =
    useGetAllocationModeVoucherTemplateQuery(
      {
        templateType: ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE_TYPE,
      },
      {
        refetchOnMountOrArgChange: true,
      },
    );
  const [saveTemplateVersion, { isLoading: isSavingTemplate }] =
    useSaveAllocationModeVoucherTemplateMutation();

  const currentServerTemplate =
    templateResponse?.template?.currentVersion?.config
      ? normalizeAllocationModeIssueVoucherTemplate(
          templateResponse.template.currentVersion.config,
        )
      : null;
  const activeTemplateVersion =
    templateResponse?.template?.currentVersion?.versionNo || null;
  const attachedTemplateVersion = voucher?.printTemplate?.versionNo || null;
  const isAttachedTemplateOutdated =
    Boolean(attachedTemplateVersion && activeTemplateVersion) &&
    attachedTemplateVersion !== activeTemplateVersion;
  const templateOptions = buildTemplateOptions({
    voucher,
    templateResponse,
  });
  const initialTemplateOptionKey =
    templateOptions.find((option) => option.isAttached)?.key ||
    templateOptions.find((option) => option.isActive)?.key ||
    templateOptions[0]?.key ||
    "default-template";
  const isEditorReady = Boolean(
    templateOptions.length && (currentServerTemplate || !isFetchingTemplate),
  );
  const templateSourceKey = voucher?.printTemplate?.versionId
    ? `voucher-version:${voucher.printTemplate.versionId}`
    : voucher?.printTemplate?.versionNo
      ? `voucher-version-no:${voucher.printTemplate.versionNo}`
      : "current-template";
  const editorKey = `${voucher?.id || "no-voucher"}:${templateSourceKey}`;
  const open = controlledOpen ?? internalOpen;
  const handleOpenChange = (nextOpen) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
      return;
    }
    setInternalOpen(nextOpen);
  };

  return (
    <>
      {!hideTrigger ? (
        <Button
          type="button"
          variant={triggerVariant}
          className={`gap-2 ${triggerClassName}`.trim()}
          onClick={() => handleOpenChange(true)}
        >
          <Printer className="h-4 w-4" />
          {triggerLabel}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-[95vw] overflow-hidden sm:max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Mẫu in phiếu xuất kho
            </DialogTitle>
          </DialogHeader>
          {isEditorReady ? (
            <AllocationVoucherPrintDialogEditor
              key={editorKey}
              voucher={voucher}
              initialTemplateOptionKey={initialTemplateOptionKey}
              templateOptions={templateOptions}
              attachedTemplateVersion={attachedTemplateVersion}
              activeTemplateVersion={activeTemplateVersion}
              isAttachedTemplateOutdated={isAttachedTemplateOutdated}
              isFetchingTemplate={isFetchingTemplate}
              onSaveTemplate={saveTemplateVersion}
              isSavingTemplate={isSavingTemplate}
            />
          ) : (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
              Đang tải mẫu in của đơn vị...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
