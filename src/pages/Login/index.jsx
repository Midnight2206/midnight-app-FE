import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

import {
  useLoginMutation,
  useLazyGetCurrentUserQuery,
} from "@/features/auth/authApi";
import { setCredentials } from "@/features/auth/authSlice";

import { loginSchema, loginDefaultValues } from "@/features/auth/authSchema";

import PasswordInput from "@/components/PasswordInput";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingButtonLabel } from "@/components/AppLoading";
import { Label } from "@/components/ui/label";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaultValues,
  });

  const [login, { isLoading }] = useLoginMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();

  const onSubmit = async (formData) => {
    if (isLoading) return;

    try {
      await login(formData).unwrap();
      const result = await getCurrentUser().unwrap();
      dispatch(setCredentials(result.data.user));

      toast.success("Đăng nhập thành công");
      navigate(from, { replace: true });
      reset();
    } catch (err) {
      const message = err?.data?.message || "Email hoặc mật khẩu không đúng";

      if (message.toLowerCase().includes("email")) {
        setError("identifier", { message });
        return;
      }

      if (message.toLowerCase().includes("password")) {
        setError("password", { message });
        return;
      }

      setError("root", { message });
      toast.error(message);
    }
  };

  return (
    <Card className="surface w-full max-w-md border-border/80">
      <CardHeader className="space-y-3 pb-4 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <CardTitle className="text-3xl font-bold">Đăng nhập hệ thống</CardTitle>

        <p className="text-sm text-muted-foreground">Truy cập dashboard để bắt đầu làm việc.</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Email hoặc tên người dùng</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...register("identifier")}
                placeholder="email@example.com hoặc username"
                className="pl-10"
              />
            </div>
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            )}
          </div>

          <PasswordInput
            name="password"
            label="Mật khẩu"
            register={register}
            error={errors.password}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            <LoadingButtonLabel loading={isLoading} loadingText="Đang đăng nhập..." defaultText="Đăng nhập" />
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
