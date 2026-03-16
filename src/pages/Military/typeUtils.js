export function formatMilitaryTypeList(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!items.length) return "-";
  return items.join(", ");
}
