import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { toast } from "sonner";
import Sidebar from "@/layouts/components/Sidebar";
import EmailVerifyBanner from "@/components/VerifyEmailBanner";
import VerifyFloatingWarning from "@/components/VerifyFloatingWarning";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRequestVerifyEmailMutation } from "@/features/auth/authApi";
import { setEmailVerifyRequestState } from "@/features/ui/uiSlice";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/utils/apiError";

export default function MainLayout() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const emailVerifyCooldownUntil = useSelector(
    (state) => state.ui.banners.emailVerifyCooldownUntil || 0,
  );
  const emailVerifyLastRequestedAt = useSelector(
    (state) => state.ui.banners.emailVerifyLastRequestedAt || 0,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [requestVerifyEmail, { isLoading: isVerifyingEmail }] =
    useRequestVerifyEmailMutation();

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
    if (emailVerifyCooldownUntil <= Date.now()) return undefined;
    const id = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [emailVerifyCooldownUntil]);

  const cooldownMsRemaining = Math.max(
    0,
    Number(emailVerifyCooldownUntil) - nowTs,
  );
  const cooldownSecondsRemaining = Math.ceil(cooldownMsRemaining / 1000);
  const verifyButtonDisabled = isVerifyingEmail || cooldownMsRemaining > 0;

  const handleVerifyEmail = async () => {
    if (!user?.id) return;
    setNowTs(Date.now());
    if (cooldownMsRemaining > 0) {
      toast.info(
        `Vui lòng chờ ${cooldownSecondsRemaining}s trước khi gửi lại email xác minh.`,
      );
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
        toast.info(
          `Vui lòng chờ ${seconds}s trước khi gửi lại email xác minh.`,
        );
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
    <div className="flex h-dvh overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-20 border-b border-border/70 bg-background/80 px-3 py-2 backdrop-blur md:px-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
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

        <div className="flex-1 overflow-auto overflow-x-hidden">
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
