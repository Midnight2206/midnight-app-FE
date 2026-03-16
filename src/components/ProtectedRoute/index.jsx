import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { PageLoader } from "@/components/AppLoading";
import { canAccessByRule } from "@/features/auth/authorization";

export default function ProtectedRoute({
  accessRule = null,
  allowedRoles = [],
  requiredPermissions = [],
  requiredPermissionPrefixes = [],
}) {
  const { user, isAuthenticated, isInitialized } = useSelector(
    (state) => state.auth,
  );
  const location = useLocation();
  const hasNotifiedRef = useRef(false);

  const normalizedAccessRule = accessRule || {
    anyRoles: allowedRoles,
    anyPermissions: requiredPermissions,
    anyPermissionPrefixes: requiredPermissionPrefixes,
  };

  const hasAccess = canAccessByRule(user, normalizedAccessRule);

  useEffect(() => {
    if (!isInitialized || hasNotifiedRef.current) return;

    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để tiếp tục.");
      hasNotifiedRef.current = true;
      return;
    }

    if (!hasAccess) {
      toast.error("Tài khoản của bạn chưa được cấp quyền truy cập khu vực này.");
      hasNotifiedRef.current = true;
    }
  }, [hasAccess, isAuthenticated, isInitialized]);

  if (!isInitialized) {
    return (
      <PageLoader
        title="Đang kiểm tra phiên đăng nhập..."
        description="Hệ thống đang xác thực quyền truy cập của bạn."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
