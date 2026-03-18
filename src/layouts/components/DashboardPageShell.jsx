import { useSelector } from "react-redux";

import DashboardTabsNav from "./DashboardTabsNav";

export default function DashboardPageShell({
  children,
  className = "space-y-4 p-4 md:p-6",
}) {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className={className}>
      <DashboardTabsNav user={user} />
      {children}
    </div>
  );
}
