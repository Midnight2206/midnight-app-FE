import {
  BookOpen,
  Home,
  Code,
  CheckSquare,
  Shield,
  Warehouse,
} from "lucide-react";
import {
  ACCESS_RULES,
  PERMISSION_PREFIXES,
} from "@/features/auth/authorization";

export const sidebarNavItems = [
  {
    name: "Trang chủ",
    path: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    name: "Danh mục quân trang",
    path: "/categories",
    icon: <Code className="h-4 w-4" />,
    accessRule: ACCESS_RULES.categoryPage,
  },
  {
    name: "Danh sách quân nhân",
    path: "/militaries",
    icon: <CheckSquare className="h-4 w-4" />,
    accessRule: ACCESS_RULES.militaryPage,
  },
  {
    name: "Sổ quân trang cá nhân",
    path: "/militaries/me/personal-ledger",
    icon: <BookOpen className="h-4 w-4" />,
    accessRule: ACCESS_RULES.personalLedgerSelfPage,
  },
  {
    name: "Kho quân trang",
    path: "/inventories",
    icon: <Warehouse className="h-4 w-4" />,
    accessRule: ACCESS_RULES.inventoryPage,
  },
  {
    name: "Đăng ký cỡ số",
    path: "/size-registrations",
    icon: <CheckSquare className="h-4 w-4" />,
    accessRule: ACCESS_RULES.sizeRegistrationPage,
  },
  {
    name: "Dashboard hệ thống",
    path: "/dashboard",
    activePrefix: "/dashboard",
    icon: <Shield className="h-4 w-4" />,
    accessRule: {
      anyPermissionPrefixes: [
        PERMISSION_PREFIXES.ACCOUNTS,
        PERMISSION_PREFIXES.ACCESS,
        PERMISSION_PREFIXES.BACKUPS,
      ],
    },
  },
];
