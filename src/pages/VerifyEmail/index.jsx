import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailWarning, Loader2, CircleX } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirmVerifyEmailMutation } from "@/features/auth/authApi";
import { getApiErrorMessage } from "@/utils/apiError";

function getStatusMeta(status) {
  if (status === "success") {
    return {
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-600" />,
      title: "Xác thực email thành công",
      description: "Email của bạn đã được xác minh. Bạn có thể đăng nhập và sử dụng đầy đủ tính năng.",
    };
  }

  if (status === "error") {
    return {
      icon: <CircleX className="h-8 w-8 text-destructive" />,
      title: "Xác thực email thất bại",
      description: "Token không hợp lệ hoặc đã hết hạn. Hãy đăng nhập để gửi lại email xác thực.",
    };
  }

  if (status === "missing-token") {
    return {
      icon: <MailWarning className="h-8 w-8 text-amber-600" />,
      title: "Thiếu token xác thực",
      description: "Liên kết xác thực không hợp lệ. Vui lòng kiểm tra lại email hoặc yêu cầu gửi lại.",
    };
  }

  return {
    icon: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
    title: "Đang xác thực email",
    description: "Vui lòng chờ trong giây lát...",
  };
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const [status, setStatus] = useState(token ? "loading" : "missing-token");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmVerifyEmail] = useConfirmVerifyEmailMutation();

  useEffect(() => {
    let active = true;
    if (!token) return;

    const run = async () => {
      try {
        await confirmVerifyEmail({ token }).unwrap();
        if (!active) return;
        setStatus("success");
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(getApiErrorMessage(error, "Xác thực email thất bại."));
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [confirmVerifyEmail, token]);

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

