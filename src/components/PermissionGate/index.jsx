import { useSelector } from "react-redux";
import { canAccessByRule } from "@/features/auth/authorization";

export default function PermissionGate({
  rule,
  fallback = null,
  children,
}) {
  const user = useSelector((state) => state.auth.user);
  const canAccess = canAccessByRule(user, rule);

  if (!canAccess) return fallback;
  return children;
}
