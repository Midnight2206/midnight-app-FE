import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, KeyRound, Loader2, CircleX } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirmPasswordChangeMutation } from "@/features/auth/authApi";
import { getApiErrorMessage } from "@/utils/apiError";

function getStatusMeta(status) {
  if (status === "success") {
    return {
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
      title: "Đổi mật khẩu thành công",
      description:
        "Mật khẩu của bạn đã được cập nhật. Các thiết bị khác đã bị đăng xuất để bảo vệ tài khoản.",
    };
  }

  if (status === "error") {
    return {
      icon: <CircleX className="h-8 w-8 text-destructive" />,
      title: "Xác minh đổi mật khẩu thất bại",
      description:
        "Liên kết đổi mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập để tạo yêu cầu mới.",
    };
  }

  if (status === "missing-token") {
    return {
      icon: <KeyRound className="h-8 w-8 text-amber-600" />,
      title: "Thiếu token xác minh",
      description:
        "Liên kết đổi mật khẩu không hợp lệ. Vui lòng kiểm tra lại email hoặc tạo yêu cầu mới.",
    };
  }

  return {
    icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
    title: "Đang xác minh thay đổi mật khẩu",
    description: "Vui lòng chờ trong giây lát...",
  };
}

export default function VerifyPasswordChangePage() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const [status, setStatus] = useState(token ? "loading" : "missing-token");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmPasswordChange] = useConfirmPasswordChangeMutation();

  useEffect(() => {
    let active = true;
    if (!token) return;

    const run = async () => {
      try {
        await confirmPasswordChange({ token }).unwrap();
        if (!active) return;
        setStatus("success");
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(getApiErrorMessage(error, "Xác minh đổi mật khẩu thất bại."));
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [confirmPasswordChange, token]);

  const meta = useMemo(() => getStatusMeta(status), [status]);

  return (
    <Card className="surface w-full max-w-md border-border/80">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          {meta.icon}
        </div>
        <CardTitle className="text-2xl font-bold">{meta.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          {status === "error" && errorMessage ? errorMessage : meta.description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {status !== "loading" && (
            <Button asChild>
              <Link to="/login">Đi đến đăng nhập</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/">Về trang chủ</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
