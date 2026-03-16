export function normalizeCodes(codes = []) {
  return [...new Set(codes)].sort();
}

export function isSameStringArray(a = [], b = []) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

export function getPermissionModule(code = "") {
  const path = code.split(" ")[1] || "";
  const parts = path.split("/").filter(Boolean);
  return parts[1] || "unknown";
}
