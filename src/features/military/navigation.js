export const MILITARY_LAST_QUERY_STORAGE_KEY_PREFIX = "military_last_query_v1";

export function getRememberedMilitaryPath(userId, basePath = "/militaries") {
  const normalizedBasePath = String(basePath || "/militaries");
  if (typeof window === "undefined") return normalizedBasePath;

  const storageKey = `${MILITARY_LAST_QUERY_STORAGE_KEY_PREFIX}:${userId || "anonymous"}`;

  try {
    const raw = String(window.localStorage.getItem(storageKey) || "").trim();
    if (!raw) return normalizedBasePath;

    const query = raw.startsWith("?") ? raw.slice(1) : raw;
    if (!query) return normalizedBasePath;

    const params = new URLSearchParams(query);
    const serialized = params.toString();
    return serialized ? `${normalizedBasePath}?${serialized}` : normalizedBasePath;
  } catch {
    return normalizedBasePath;
  }
}
