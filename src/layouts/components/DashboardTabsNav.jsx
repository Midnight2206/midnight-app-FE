import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Database, KeyRound, Shield } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { canAccessByRule } from "@/features/auth/authorization";
import { dashboardHeaderMenuItems } from "./headerDashboardMenu.config";

function getDashboardTabIcon(path) {
  if (path.startsWith("/dashboard/access")) return KeyRound;
  if (path.startsWith("/dashboard/backups")) return Database;
  return Shield;
}

function getActiveDashboardTab(items, pathname) {
  const directMatch = items.find((item) => pathname === item.path);
  if (directMatch) return directMatch.path;

  const prefixMatch = items.find((item) => {
    const basePath = item.path.split("/").slice(0, 3).join("/");
    return pathname.startsWith(basePath);
  });

  return prefixMatch?.path || items[0]?.path || "";
}

export default function DashboardTabsNav({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const items = useMemo(
    () =>
      dashboardHeaderMenuItems.filter(
        (item) => !item.accessRule || canAccessByRule(user, item.accessRule),
      ),
    [user],
  );

  if (items.length === 0) return null;

  const activeValue = getActiveDashboardTab(items, location.pathname);

  return (
    <Card className="surface overflow-hidden p-1.5 md:p-2">
      <Tabs value={activeValue} onValueChange={(value) => value && navigate(value)}>
        <TabsList className="flex h-auto w-full flex-nowrap justify-start gap-2 overflow-x-auto bg-transparent p-0 pb-1">
          {items.map((item) => (
            (() => {
              const Icon = getDashboardTabIcon(item.path);
              return (
                <TabsTrigger
                  key={item.path}
                  value={item.path}
                  className="h-auto min-w-fit flex-none rounded-xl border px-3 py-2 text-xs sm:text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </TabsTrigger>
              );
            })()
          ))}
        </TabsList>
      </Tabs>
    </Card>
  );
}
