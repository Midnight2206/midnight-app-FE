import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  canAccessByRule,
  getUserPermissions,
  getUserRoles,
  hasAnyPermission,
  hasAnyPermissionPrefix,
  hasAnyRole,
  isSuperAdmin as checkIsSuperAdmin,
} from "@/features/auth/authorization";

export function useAuthorization() {
  const user = useSelector((state) => state.auth.user);

  return useMemo(
    () => {
      const isSuperAdmin = checkIsSuperAdmin(user);

      return {
        user,
        roles: getUserRoles(user),
        permissions: getUserPermissions(user),
        isSuperAdmin,
        can: (rule) => canAccessByRule(user, rule),
        hasRole: (roles) => hasAnyRole(user, roles),
        hasPermission: (codes) =>
          isSuperAdmin ? true : hasAnyPermission(user, codes),
        hasPermissionPrefix: (prefixes) =>
          isSuperAdmin ? true : hasAnyPermissionPrefix(user, prefixes),
      };
    },
    [user],
  );
}
