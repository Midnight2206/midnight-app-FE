import {
  Package,
  Truck,
  User,
  Shield,
  Settings,
  Warehouse,
} from "lucide-react";
import { ACCESS_RULES } from "@/features/auth/authorization";

export const userQuickActions = [
  {
    key: "my-orders",
    icon: <Package className="h-4 w-4" />,
    title: "Đơn hàng của tôi",
    desc: "Xem các đơn hàng liên quan",
    to: "/posts",
  },
  {
    key: "transport",
    icon: <Truck className="h-4 w-4" />,
    title: "Theo dõi vận chuyển",
    desc: "Kiểm tra trạng thái giao hàng",
    to: "/categories",
  },
  {
    key: "profile",
    icon: <User className="h-4 w-4" />,
    title: "Thông tin tài khoản",
    desc: "Quản lý hồ sơ và phiên đăng nhập",
    to: "/",
  },
];

export const privilegedQuickActions = [
  {
    key: "military-list",
    icon: <Shield className="h-4 w-4" />,
    title: "Danh sách quân nhân",
    desc: "Xem và khởi tạo dữ liệu quân nhân",
    to: "/militaries",
    accessRule: ACCESS_RULES.militaryPage,
  },
  {
    key: "system-access",
    icon: <Settings className="h-4 w-4" />,
    title: "Phân hệ hệ thống",
    desc: "Quản lý tài khoản, phân quyền và cấu hình",
    to: "/dashboard/accounts/create",
    accessRule: ACCESS_RULES.accountDashboardPage,
  },
  {
    key: "category-management",
    icon: <Warehouse className="h-4 w-4" />,
    title: "Mặt hàng quân trang",
    desc: "Quản trị mặt hàng, version và color",
    to: "/categories",
    accessRule: ACCESS_RULES.categoryPage,
  },
];
