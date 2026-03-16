import { AlertTriangle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { showEmailVerify } from "@/features/ui/uiSlice";

export default function VerifyFloatingWarning({ user }) {
  const dispatch = useDispatch();

  const dismissed = useSelector(
    (state) => state.ui.banners.emailVerifyDismissed,
  );

  if (!user || user.verifiedAt || !dismissed) return null;

  return (
    <button
      onClick={() => dispatch(showEmailVerify())}
      className="fixed z-50 flex items-center gap-2 px-3 py-2 text-sm text-white bg-yellow-600 rounded-full shadow-lg bottom-6 right-6 hover:bg-yellow-700"
    >
      <AlertTriangle className="w-4 h-4" />
      Email not verified
    </button>
  );
}
