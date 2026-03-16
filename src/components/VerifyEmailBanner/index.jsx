import { X, Mail } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { dismissEmailVerify } from "@/features/ui/uiSlice";

export default function EmailVerifyBanner({
  user,
  onVerify,
  isVerifying = false,
  verifyDisabled = false,
  cooldownSecondsRemaining = 0,
  lastRequestedAt = 0,
}) {
  const dispatch = useDispatch();
  const dismissed = useSelector(
    (state) => state.ui.banners.emailVerifyDismissed,
  );

  const hasRecentRequest = Number(lastRequestedAt) > 0;
  const requestedTimeLabel = hasRecentRequest
    ? new Date(Number(lastRequestedAt)).toLocaleTimeString("vi-VN")
    : "";

  if (!user || user.verifiedAt || dismissed) return null;

  return (
    <div className="absolute left-3 right-3 top-[68px] z-40 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-sm md:left-4 md:right-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-yellow-800">
          <Mail className="w-5 h-5" />
          <span>
            Email của bạn chưa xác thực. Vui lòng xác thực để mở đầy đủ chức năng.
          </span>
        </div>

        <button
          onClick={() => dispatch(dismissEmailVerify())}
          className="p-1 text-yellow-700 rounded hover:bg-yellow-100"
          aria-label="Dismiss email verify banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-yellow-800/90">
          {cooldownSecondsRemaining > 0
            ? `Yêu cầu đã gửi. Có thể gửi lại sau ${cooldownSecondsRemaining}s.`
            : hasRecentRequest
              ? `Lần gửi gần nhất: ${requestedTimeLabel}.`
              : "Bạn có thể gửi email xác thực ngay bây giờ."}
        </div>

        <button
          onClick={onVerify}
          disabled={!onVerify || isVerifying || verifyDisabled}
          className="px-4 py-2 text-sm text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isVerifying
            ? "Đang gửi..."
            : cooldownSecondsRemaining > 0
              ? `Gửi lại sau ${cooldownSecondsRemaining}s`
              : "Gửi email xác thực"}
        </button>
      </div>
    </div>
  );
}
