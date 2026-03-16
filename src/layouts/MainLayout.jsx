import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import Sidebar from "@/layouts/components/Sidebar";
import ToggleTheme from "@/layouts/components/ToggleTheme";
import EmailVerifyBanner from "@/components/VerifyEmailBanner";
import VerifyFloatingWarning from "@/components/VerifyFloatingWarning";
import ErrorBoundary from "@/components/ErrorBoundary";
import { canAccessByRule } from "@/features/auth/authorization";
import { useRequestVerifyEmailMutation } from "@/features/auth/authApi";
import { setEmailVerifyRequestState } from "@/features/ui/uiSlice";
import { dashboardHeaderMenuItems } from "@/layouts/components/headerDashboardMenu.config";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/utils/apiError";

function getVisibleDashboardHeaderItems(user) {
  return dashboardHeaderMenuItems.filter((item) =>
    canAccessByRule(user, item.accessRule),
  );
}

export default function MainLayout() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const emailVerifyCooldownUntil = useSelector(
    (state) => state.ui.banners.emailVerifyCooldownUntil || 0,
  );
  const emailVerifyLastRequestedAt = useSelector(
    (state) => state.ui.banners.emailVerifyLastRequestedAt || 0,
  );
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  const [requestVerifyEmail, { isLoading: isVerifyingEmail }] =
    useRequestVerifyEmailMutation();

  const visibleDashboardHeaderItems = useMemo(
    () => getVisibleDashboardHeaderItems(user),
    [user],
  );

  const showDashboardHeaderMenu =
    visibleDashboardHeaderItems.length > 0 ||
    location.pathname.startsWith("/dashboard/accounts") ||
    location.pathname.startsWith("/dashboard/access") ||
    location.pathname.startsWith("/dashboard/backups");

  useEffect(() => {
    if (!user?.verifiedAt) return;
    dispatch(
      setEmailVerifyRequestState({
        cooldownUntil: 0,
        requestedAt: 0,
      }),
    );
  }, [dispatch, user?.verifiedAt]);

  useEffect(() => {
    setNowTs(Date.now());
    if (emailVerifyCooldownUntil <= Date.now()) return undefined;
    const id = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [emailVerifyCooldownUntil]);

  const cooldownMsRemaining = Math.max(0, Number(emailVerifyCooldownUntil) - nowTs);
  const cooldownSecondsRemaining = Math.ceil(cooldownMsRemaining / 1000);
  const verifyButtonDisabled = isVerifyingEmail || cooldownMsRemaining > 0;

  const handleVerifyEmail = async () => {
    if (!user?.id) return;
    setNowTs(Date.now());
    if (cooldownMsRemaining > 0) {
      toast.info(`Vui lòng chờ ${cooldownSecondsRemaining}s trước khi gửi lại email xác minh.`);
      return;
    }
    try {
      const response = await requestVerifyEmail().unwrap();
      const result = response?.data || {};

      if (result.alreadyVerified) {
        toast.success("Email đã được xác minh trước đó.");
        dispatch(
          setEmailVerifyRequestState({
            cooldownUntil: 0,
            requestedAt: 0,
          }),
        );
        return;
      }

      const retryAfterMs = Number(result.retryAfterMs || 0);
      if (!result.queued && retryAfterMs > 0) {
        const seconds = Math.ceil(Number(result.retryAfterMs) / 1000);
        dispatch(
          setEmailVerifyRequestState({
            cooldownUntil: Date.now() + retryAfterMs,
            requestedAt: Date.now(),
          }),
        );
        toast.info(`Vui lòng chờ ${seconds}s trước khi gửi lại email xác minh.`);
        return;
      }

      dispatch(
        setEmailVerifyRequestState({
          cooldownUntil: Date.now() + Math.max(retryAfterMs, 60_000),
          requestedAt: Date.now(),
        }),
      );
      toast.success("Đã đưa yêu cầu xác minh vào hàng chờ gửi email.");
    } catch (error) {
      if (error?.status === 404) {
        toast.error("Server chưa bật chức năng gửi email xác minh.");
        return;
      }
      toast.error(getApiErrorMessage(error, "Không gửi được email xác minh."));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border/70 bg-background/70 px-3 py-3 backdrop-blur md:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {showDashboardHeaderMenu &&
                  visibleDashboardHeaderItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `rounded-xl border px-3 py-1.5 text-xs font-medium transition-all md:px-3.5 md:py-2 md:text-sm ${
                          isActive
                            ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
                            : "border-border/70 bg-background/70 hover:bg-accent"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
              </div>
            </div>

            <ToggleTheme />
          </div>
        </div>

        <EmailVerifyBanner
          user={user}
          onVerify={handleVerifyEmail}
          isVerifying={isVerifyingEmail}
          verifyDisabled={verifyButtonDisabled}
          cooldownSecondsRemaining={cooldownSecondsRemaining}
          lastRequestedAt={emailVerifyLastRequestedAt}
        />
        <VerifyFloatingWarning user={user} />

        <div className="flex-1 overflow-auto">
          <ErrorBoundary>
            <div className="page-shell animate-fade-in">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
