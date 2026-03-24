export const PERMISSION_PREFIXES = {
  MILITARIES: "/api/militaries",
  SIZE_REGISTRATIONS: "/api/size-registrations",
  CATEGORIES: "/api/categories",
  ACCOUNTS: "/api/accounts",
  ACCESS: "/api/access",
  BACKUPS: "/api/backups",
  INVENTORIES: "/api/inventories",
};

export const ROLE_NAMES = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
};

export const ACCESS_RULES = {
  militaryPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.MILITARIES],
  },
  personalLedgerSelfPage: {
    anyRoles: [ROLE_NAMES.USER],
  },
  personalLedgerAdminPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.MILITARIES],
  },
  sizeRegistrationPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.SIZE_REGISTRATIONS],
  },
  accessControlPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.ACCESS],
  },
  accountDashboardPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.ACCOUNTS],
  },
  categoryPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.CATEGORIES],
  },
  backupRecoveryPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.BACKUPS],
  },
  inventoryPage: {
    anyPermissionPrefixes: [PERMISSION_PREFIXES.INVENTORIES],
  },
};

function normalizeList(list) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

function getPermissionPath(permissionCode) {
  const parts = String(permissionCode || "").split(" ");
  return parts.length >= 2 ? parts.slice(1).join(" ") : "";
}

export function getUserRoles(user) {
  return normalizeList(user?.roles);
}

export function getUserPermissions(user) {
  return normalizeList(user?.permissions);
}

export function isSuperAdmin(user) {
  return getUserRoles(user).includes(ROLE_NAMES.SUPER_ADMIN);
}

export function hasAnyRole(user, expectedRoles = []) {
  const roles = getUserRoles(user);
  const targetRoles = normalizeList(expectedRoles);
  if (targetRoles.length === 0) return true;
  return targetRoles.some((role) => roles.includes(role));
}

export function hasAllRoles(user, expectedRoles = []) {
  const roles = getUserRoles(user);
  const targetRoles = normalizeList(expectedRoles);
  if (targetRoles.length === 0) return true;
  return targetRoles.every((role) => roles.includes(role));
}

export function hasAnyPermission(user, expectedPermissions = []) {
  const permissions = getUserPermissions(user);
  const targetPermissions = normalizeList(expectedPermissions);
  if (targetPermissions.length === 0) return true;
  return targetPermissions.some((permission) => permissions.includes(permission));
}

export function hasAllPermissions(user, expectedPermissions = []) {
  const permissions = getUserPermissions(user);
  const targetPermissions = normalizeList(expectedPermissions);
  if (targetPermissions.length === 0) return true;
  return targetPermissions.every((permission) => permissions.includes(permission));
}

export function hasAnyPermissionPrefix(user, prefixes = []) {
  const permissions = getUserPermissions(user);
  const targetPrefixes = normalizeList(prefixes);
  if (targetPrefixes.length === 0) return true;

  const permissionPaths = permissions.map(getPermissionPath).filter(Boolean);
  return targetPrefixes.some((prefix) =>
    permissionPaths.some((path) => path.startsWith(prefix)),
  );
}

export function canAccessByRule(user, rule = {}) {
  if (isSuperAdmin(user)) return true;

  const {
    anyRoles = [],
    allRoles = [],
    anyPermissions = [],
    allPermissions = [],
    anyPermissionPrefixes = [],
  } = rule;

  const softChecks = [
    anyRoles.length === 0 ? null : hasAnyRole(user, anyRoles),
    anyPermissions.length === 0 ? null : hasAnyPermission(user, anyPermissions),
    anyPermissionPrefixes.length === 0
      ? null
      : hasAnyPermissionPrefix(user, anyPermissionPrefixes),
  ].filter((value) => value !== null);

  const hardChecks = [
    allRoles.length === 0 || hasAllRoles(user, allRoles),
    allPermissions.length === 0 || hasAllPermissions(user, allPermissions),
  ];

  const passSoftChecks =
    softChecks.length === 0 ? true : softChecks.some(Boolean);

  return hardChecks.every(Boolean) && passSoftChecks;
}
