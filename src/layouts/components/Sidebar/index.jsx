import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";
import { clearCredentials } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import { canAccessByRule } from "@/features/auth/authorization";
import { getRememberedMilitaryPath } from "@/features/military/navigation";
import { sidebarNavItems } from "@/layouts/components/sidebarNav.config";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getUserInitials(user) {
  const source = user?.username || user?.email || "U";
  return String(source).slice(0, 2).toUpperCase();
}

function getVisibleNavItems(user) {
  return sidebarNavItems.filter((item) => {
    if (!item.accessRule) return true;
    return canAccessByRule(user, item.accessRule);
  });
}

function SidebarBody({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logout, { isLoading }] = useLogoutMutation();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const visibleNavItems = getVisibleNavItems(user);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearCredentials());
      toast.success("Đăng xuất thành công");
      navigate("/");
      onClose?.();
    } catch {
      toast.error("Đăng xuất thất bại");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 rounded-2xl border border-border/70 bg-background/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Logistics Control
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground">F8 Command Panel</h2>
      </div>

      <nav className="flex flex-col gap-1.5">
        {visibleNavItems.map((item) => {
          const targetPath =
            item.path === "/militaries"
              ? getRememberedMilitaryPath(user?.id, item.path)
              : item.path;
          const isActive = item.activePrefix
            ? location.pathname.startsWith(item.activePrefix)
            : location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={targetPath}
              onClick={onClose}
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-accent/80"
              }`}
            >
              {item.icon}
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/65 p-3 text-sm">
        {isAuthenticated && user ? (
          <>
            <NavLink
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-accent"
            >
              <Avatar className="h-9 w-9 rounded-xl border border-border/70">
                <AvatarFallback className="rounded-xl text-xs font-semibold">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.username}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.unit?.name || user.email}
                </p>
              </div>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={onClose}
              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              Cài đặt
            </NavLink>

            <button
              onClick={handleLogout}
              className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              onClick={onClose}
              className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </NavLink>

            <NavLink
              to="/register"
              onClick={onClose}
              className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-accent"
            >
              <UserPlus className="h-4 w-4" />
              Đăng ký
            </NavLink>
          </>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  return (
    <>
      <aside className="hidden h-dvh w-68 shrink-0 overflow-y-auto border-r border-border/70 bg-sidebar/85 p-4 backdrop-blur md:flex lg:w-72">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            className="absolute inset-0 bg-black/45"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-[min(20rem,calc(100vw-1rem))] flex-col overflow-y-auto rounded-r-3xl border-r border-border/70 bg-sidebar p-4 shadow-2xl">
            <div className="mb-2 flex justify-end">
              <Button variant="outline" size="icon-sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarBody onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
