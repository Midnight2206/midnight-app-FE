import { ACCESS_RULES, PERMISSION_PREFIXES } from "@/features/auth/authorization";

export const dashboardHeaderMenuItems = [
  {
    label: "Tạo ADMIN",
    path: "/dashboard/accounts/create",
    accessRule: {
      ...ACCESS_RULES.accountDashboardPage,
      anyPermissionPrefixes: [PERMISSION_PREFIXES.ACCOUNTS],
    },
  },
  {
    label: "Quản lý tài khoản",
    path: "/dashboard/accounts/manage",
    accessRule: {
      ...ACCESS_RULES.accountDashboardPage,
      anyPermissionPrefixes: [PERMISSION_PREFIXES.ACCOUNTS],
    },
  },
  {
    label: "Audit log",
    path: "/dashboard/accounts/audits",
    accessRule: {
      ...ACCESS_RULES.accountDashboardPage,
      anyPermissionPrefixes: [PERMISSION_PREFIXES.ACCOUNTS],
    },
  },
  {
    label: "Phân quyền",
    path: "/dashboard/access",
    accessRule: ACCESS_RULES.accessControlPage,
  },
  {
    label: "Khôi phục DB",
    path: "/dashboard/backups",
    accessRule: ACCESS_RULES.backupRecoveryPage,
  },
];
