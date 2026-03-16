import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User, ShieldCheck, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";

import {
  useRegisterMutation,
  useLazyGetCurrentUserQuery,
} from "@/features/auth/authApi";
import { setCredentials } from "@/features/auth/authSlice";

import {
  registerSchema,
  registerDefaultValues,
} from "@/features/auth/authSchema";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingButtonLabel } from "@/components/AppLoading";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaultValues,
  });

  const [registerUser, { isLoading }] = useRegisterMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();

  const onSubmit = async (formData) => {
    if (isLoading) return;

    try {
      await registerUser(formData).unwrap();
      const result = await getCurrentUser().unwrap();
      const user = result.data?.user ?? result;
      dispatch(setCredentials(user));

      toast.success("Đăng ký thành công");
      navigate(from, { replace: true });
    } catch (err) {
      const message = err?.data?.message || "Đăng ký thất bại, vui lòng thử lại.";

      if (message.toLowerCase().includes("email")) {
        setError("email", { type: "server", message });
        return;
      }

      if (message.toLowerCase().includes("username")) {
        setError("username", { type: "server", message });
        return;
      }

      setError("root", { type: "server", message });
      toast.error(message);
    }
  };

  return (
    <Card className="surface w-full max-w-md border-border/80">
      <CardHeader className="space-y-3 pb-4 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BadgeCheck className="h-7 w-7" />
        </div>

        <CardTitle className="text-3xl font-bold">Tạo tài khoản mới</CardTitle>

        <p className="text-sm text-muted-foreground">Điền thông tin để kích hoạt tài khoản của bạn.</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input {...register("email")} placeholder="email@example.com" className="pl-10" />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tên người dùng</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input {...register("username")} placeholder="yourname" className="pl-10" />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          <PasswordInput
            name="password"
            label="Mật khẩu"
            register={register}
            error={errors.password}
          />

          <div className="space-y-2">
            <Label>Mã quân nhân</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input {...register("militaryCode")} placeholder="VD: MC001" className="pl-10" />
            </div>
            {errors.militaryCode && (
              <p className="text-sm text-destructive">{errors.militaryCode.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            <LoadingButtonLabel loading={isLoading} loadingText="Đang tạo tài khoản..." defaultText="Đăng ký" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
