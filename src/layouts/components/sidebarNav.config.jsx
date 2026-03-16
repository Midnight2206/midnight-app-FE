import {
  Home,
  Code,
  FileText,
  CheckSquare,
  Shield,
  KeyRound,
  Database,
  Warehouse,
} from "lucide-react";
import { ACCESS_RULES } from "@/features/auth/authorization";

export const sidebarNavItems = [
  {
    name: "Trang chủ",
    path: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    name: "Mặt hàng quân trang",
    path: "/categories",
    icon: <Code className="h-4 w-4" />,
    accessRule: ACCESS_RULES.categoryPage,
  },
  {
    name: "Posts",
    path: "/posts",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    name: "Danh sách quân nhân",
    path: "/militaries",
    icon: <CheckSquare className="h-4 w-4" />,
    accessRule: ACCESS_RULES.militaryPage,
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
    name: "Dashboard tài khoản",
    path: "/dashboard/accounts/create",
    activePrefix: "/dashboard/accounts",
    icon: <Shield className="h-4 w-4" />,
    accessRule: ACCESS_RULES.accountDashboardPage,
  },
  {
    name: "Quản lý phân quyền",
    path: "/dashboard/access",
    activePrefix: "/dashboard/access",
    icon: <KeyRound className="h-4 w-4" />,
    accessRule: ACCESS_RULES.accessControlPage,
  },
  {
    name: "Khôi phục dữ liệu",
    path: "/dashboard/backups",
    activePrefix: "/dashboard/backups",
    icon: <Database className="h-4 w-4" />,
    accessRule: ACCESS_RULES.backupRecoveryPage,
  },
];
