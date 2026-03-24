export const ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE_TYPE =
  "ALLOCATION_MODE_ISSUE_VOUCHER";

export const SIGNATURE_SUBTITLE_MAX_CHARS_PER_LINE = 28;
export const SIGNATURE_WIDTH_PERCENT_TOTAL = 100;
export const SIGNATURE_WIDTH_PERCENT_MIN = 5;
export const SIGNATURE_WIDTH_PERCENT_STEP = 3;

export const DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE = {
  headerLine1: "",
  headerLine2: "",
  formCode: "Mẫu số: PXK",
  title: "PHIẾU XUẤT KHO",
  receiverLabel: "Họ và tên người nhận hàng",
  unitLabel: "Đơn vị",
  reasonLabel: "Lý do xuất kho",
  signatures: [
    {
      title: "Người lập phiếu",
      subtitle: "(Ký, ghi rõ họ tên)",
      signerName: "",
      widthPercent: 25,
    },
    {
      title: "Người nhận hàng",
      subtitle: "(Ký, ghi rõ họ tên)",
      signerName: "",
      widthPercent: 25,
    },
    {
      title: "Thủ kho",
      subtitle: "(Ký, ghi rõ họ tên)",
      signerName: "",
      widthPercent: 25,
    },
    {
      title: "Chỉ huy đơn vị",
      subtitle: "(Ký, đóng dấu)",
      signerName: "",
      widthPercent: 25,
    },
  ],
};

function cloneJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value, maxLength = 191) {
  return String(value || "").slice(0, maxLength);
}

export function normalizeSignatureSubtitle(subtitle) {
  return String(subtitle || "")
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.slice(0, SIGNATURE_SUBTITLE_MAX_CHARS_PER_LINE))
    .join("\n");
}

export function normalizeSignatureWidthPercent(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return SIGNATURE_WIDTH_PERCENT_MIN;
  return Math.min(
    SIGNATURE_WIDTH_PERCENT_TOTAL,
    Math.max(SIGNATURE_WIDTH_PERCENT_MIN, Math.round(numericValue)),
  );
}

function distributeEvenSignatureWidthPercents(count) {
  if (!count) return [];
  const base = Math.floor(SIGNATURE_WIDTH_PERCENT_TOTAL / count);
  const remainder = SIGNATURE_WIDTH_PERCENT_TOTAL - base * count;

  return Array.from({ length: count }, (_, index) =>
    base + (index < remainder ? 1 : 0),
  );
}

export function rebalanceSignatureWidthPercents(
  widthPercents,
  pinnedIndex = null,
) {
  if (!widthPercents.length) return [];

  const nextPercents = widthPercents.map((value) =>
    normalizeSignatureWidthPercent(value),
  );
  const minTotal = nextPercents.length * SIGNATURE_WIDTH_PERCENT_MIN;
  if (minTotal > SIGNATURE_WIDTH_PERCENT_TOTAL) {
    return distributeEvenSignatureWidthPercents(nextPercents.length);
  }

  let diff =
    SIGNATURE_WIDTH_PERCENT_TOTAL -
    nextPercents.reduce((sum, value) => sum + value, 0);

  while (diff !== 0) {
    const candidateIndexes = nextPercents
      .map((value, index) => ({ value, index }))
      .filter(({ index, value }) =>
        diff > 0
          ? index !== pinnedIndex
          : index !== pinnedIndex && value > SIGNATURE_WIDTH_PERCENT_MIN,
      )
      .sort((left, right) =>
        diff > 0 ? left.value - right.value : right.value - left.value,
      )
      .map(({ index }) => index);

    if (!candidateIndexes.length) {
      const fallbackIndex =
        pinnedIndex ??
        nextPercents.findIndex((value) => value > SIGNATURE_WIDTH_PERCENT_MIN);
      if (fallbackIndex === -1) break;
      candidateIndexes.push(fallbackIndex);
    }

    let changed = false;
    for (const index of candidateIndexes) {
      if (diff === 0) break;
      if (diff > 0) {
        nextPercents[index] += 1;
        diff -= 1;
        changed = true;
        continue;
      }
      if (nextPercents[index] <= SIGNATURE_WIDTH_PERCENT_MIN) continue;
      nextPercents[index] -= 1;
      diff += 1;
      changed = true;
    }

    if (!changed) break;
  }

  return nextPercents;
}

export function normalizeSignatureWidthPercents(signatures = []) {
  if (!signatures.length) return [];

  const rawPercents = signatures.map((signature) => Number(signature?.widthPercent));
  const hasStoredPercents = rawPercents.some((value) => Number.isFinite(value));
  const baseValues = hasStoredPercents
    ? rawPercents.map((value) =>
        Number.isFinite(value) ? value : SIGNATURE_WIDTH_PERCENT_MIN,
      )
    : signatures.map((signature) => {
        const legacyWeight = Number(signature?.widthWeight);
        return Number.isFinite(legacyWeight) && legacyWeight > 0 ? legacyWeight : 1;
      });

  const totalBase = baseValues.reduce((sum, value) => sum + value, 0);
  if (totalBase <= 0) {
    return distributeEvenSignatureWidthPercents(signatures.length);
  }

  const scaledValues = baseValues.map(
    (value) => (value / totalBase) * SIGNATURE_WIDTH_PERCENT_TOTAL,
  );
  return rebalanceSignatureWidthPercents(
    scaledValues.map((value) => Math.round(value)),
  );
}

function buildFallbackSignature(index) {
  const defaultSignature =
    DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE.signatures[index];

  if (defaultSignature) {
    return cloneJsonValue(defaultSignature);
  }

  return {
    title: `Chữ ký ${index + 1}`,
    subtitle: "",
    signerName: "",
    widthPercent: SIGNATURE_WIDTH_PERCENT_MIN,
  };
}

export function normalizeAllocationModeIssueVoucherTemplate(config) {
  const source =
    config && typeof config === "object" && !Array.isArray(config) ? config : {};
  const signatureSource = Array.isArray(source.signatures)
    ? source.signatures.filter(Boolean).slice(0, 8)
    : [];
  const nextSignaturesSource = signatureSource.length
    ? signatureSource
    : DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE.signatures;

  const normalizedSignatures = nextSignaturesSource.map((signature, index) => {
    const fallback = buildFallbackSignature(index);
    const candidate =
      signature && typeof signature === "object" && !Array.isArray(signature)
        ? signature
        : {};

    return {
      title: normalizeText(candidate.title ?? fallback.title),
      subtitle: normalizeSignatureSubtitle(candidate.subtitle ?? fallback.subtitle),
      signerName: normalizeText(candidate.signerName ?? fallback.signerName),
      widthPercent:
        candidate.widthPercent ?? candidate.widthWeight ?? fallback.widthPercent,
    };
  });

  const widthPercents = normalizeSignatureWidthPercents(normalizedSignatures);

  return {
    headerLine1: normalizeText(source.headerLine1),
    headerLine2: normalizeText(source.headerLine2),
    formCode: normalizeText(
      source.formCode ?? DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE.formCode,
    ),
    title: normalizeText(
      source.title ?? DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE.title,
    ),
    receiverLabel: normalizeText(
      source.receiverLabel ??
        DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE.receiverLabel,
    ),
    unitLabel: normalizeText(
      source.unitLabel ?? DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE.unitLabel,
    ),
    reasonLabel: normalizeText(
      source.reasonLabel ??
        DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE.reasonLabel,
    ),
    signatures: normalizedSignatures.map((signature, index) => ({
      ...signature,
      widthPercent: widthPercents[index],
    })),
  };
}

export function getDefaultAllocationModeIssueVoucherTemplate() {
  return normalizeAllocationModeIssueVoucherTemplate(
    cloneJsonValue(DEFAULT_ALLOCATION_MODE_ISSUE_VOUCHER_TEMPLATE),
  );
}
