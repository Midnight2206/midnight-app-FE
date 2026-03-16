import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, clearCredentials } from "@/features/auth/authSlice";
import { useLazyGetCurrentUserQuery } from "@/features/auth/authApi";
import { PageLoader } from "@/components/AppLoading";

const AUTH_SYNC_INTERVAL_MS = 60_000;

export default function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    const syncCurrentUser = async ({ strict = false } = {}) => {
      try {
        const result = await getCurrentUser().unwrap();
        if (!active) return;
        dispatch(setCredentials(result.data.user));
      } catch (error) {
        if (!active) return;
        const status = Number(error?.status || error?.originalStatus || 0);
        if (strict || status === 401 || status === 403) {
          dispatch(clearCredentials());
        }
      }
    };

    const initAuth = async () => {
      try {
        await syncCurrentUser({ strict: true });
      } finally {
        setInitializing(false);
      }
    };

    initAuth();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState !== "visible") return;
      syncCurrentUser();
    };

    const handleOnline = () => {
      syncCurrentUser();
    };

    const intervalId = window.setInterval(() => {
      syncCurrentUser();
    }, AUTH_SYNC_INTERVAL_MS);

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [dispatch, getCurrentUser]);

  if (initializing) {
    return (
      <PageLoader
        title="Đang khởi tạo hệ thống..."
        description="Vui lòng chờ để hoàn tất đồng bộ phiên làm việc."
      />
    );
  }

  return children;
}
