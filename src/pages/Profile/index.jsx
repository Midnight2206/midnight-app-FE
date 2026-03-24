import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import {
  BadgeCheck,
  CalendarDays,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  useCancelPasswordChangeRequestMutation,
  useGetMyProfileQuery,
  useGetMySessionsQuery,
  useGetPasswordChangeStatusQuery,
  useRequestPasswordChangeMutation,
  useUpdateMyProfileMutation,
} from "@/features/auth/authApi";
import { getApiErrorMessage } from "@/utils/apiError";
import { DISPLAY_LABELS } from "@/utils/constants";
import PasswordInput from "@/components/PasswordInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  PageLoader,
  SectionLoader,
  LoadingButtonLabel,
} from "@/components/AppLoading";

function getInitials(profile, user) {
  const source = profile?.fullName || user?.username || user?.email || "U";
  return String(source)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return date.toLocaleString("vi-VN");
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatRoles(user, profileData) {
  const roles = profileData?.roles || user?.roles || [];
  if (!Array.isArray(roles) || roles.length === 0) return ["USER"];
  return roles;
}

function getPendingMeta(status) {
  if (!status?.isPending) {
    return {
      title: "Đổi mật khẩu qua email xác minh",
      description:
        "Để đổi mật khẩu, bạn cần xác minh qua email. Liên kết xác minh sẽ có hiệu lực trong 2 giờ.",
      buttonText: "Gửi email xác minh đổi mật khẩu",
      disabled: false,
    };
  }

  return {
    title: "Đang chờ xác minh đổi mật khẩu",
    description: `Yêu cầu đổi mật khẩu đang chờ xác minh đến ${formatDateTime(status.expiresAt)}.`,
    buttonText: "Đang chờ xác minh",
    disabled: true,
  };
}

export default function ProfilePage() {
  const user = useSelector((state) => state.auth.user);
  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetMyProfileQuery();
  const { data: sessionsResponse, isLoading: isSessionsLoading } =
    useGetMySessionsQuery();
  const { data: passwordStatusResponse } = useGetPasswordChangeStatusQuery();
  const [updateMyProfile, { isLoading: isSavingProfile }] =
    useUpdateMyProfileMutation();
  const [
    cancelPasswordChangeRequest,
    { isLoading: isCancellingPasswordChange },
  ] = useCancelPasswordChangeRequestMutation();
  const [requestPasswordChange, { isLoading: isRequestingPasswordChange }] =
    useRequestPasswordChangeMutation();

  const profileData = profileResponse?.data || null;
  const sessions = sessionsResponse?.data?.sessions || [];
  const passwordStatus =
    passwordStatusResponse?.data || profileData?.passwordChangeRequest || {};
  const pendingMeta = getPendingMeta(passwordStatus);

  const profileForm = useForm({
    defaultValues: {
      fullName: "",
      avatar: "",
      phone: "",
      birthday: "",
      initialCommissioningYear: "",
      assignedUnit: "",
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    profileForm.reset({
      fullName: profileData?.profile?.fullName || "",
      avatar: profileData?.profile?.avatar || "",
      phone: profileData?.profile?.phone || "",
      birthday: formatDateInput(profileData?.profile?.birthday),
      initialCommissioningYear: profileData?.profile?.initialCommissioningYear
        ? String(profileData.profile.initialCommissioningYear)
        : "",
      assignedUnit: profileData?.profile?.assignedUnit || "",
    });
  }, [profileData, profileForm]);

  const currentSession = useMemo(
    () => sessions.find((session) => session.isCurrent) || sessions[0] || null,
    [sessions],
  );

  const handleProfileSubmit = profileForm.handleSubmit(async (values) => {
    try {
      await updateMyProfile(values).unwrap();
      toast.success("Đã cập nhật hồ sơ cá nhân.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Cập nhật hồ sơ thất bại."));
    }
  });

  const handlePasswordSubmit = passwordForm.handleSubmit(async (values) => {
    try {
      await requestPasswordChange(values).unwrap();
      toast.success("Đã gửi email xác minh đổi mật khẩu.");
      passwordForm.reset();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể gửi yêu cầu đổi mật khẩu."),
      );
    }
  });

  const handleCancelPasswordChange = async () => {
    try {
      await cancelPasswordChangeRequest().unwrap();
      toast.success("Đã hủy yêu cầu đổi mật khẩu.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể hủy yêu cầu đổi mật khẩu."),
      );
    }
  };

  if (isProfileLoading) {
    return (
      <PageLoader
        title="Đang tải hồ sơ cá nhân..."
        description="Hệ thống đang đồng bộ thông tin tài khoản và bảo mật."
      />
    );
  }

  const effectiveUser = profileData || user;
  const roleLabels = formatRoles(user, profileData);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card className="surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Avatar className="h-20 w-20 rounded-3xl border border-border/70">
            <AvatarImage
              src={profileData?.profile?.avatar || ""}
              alt={effectiveUser?.username || "user"}
            />
            <AvatarFallback className="rounded-3xl text-lg font-semibold">
              {getInitials(profileData?.profile, effectiveUser)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              Hồ sơ cá nhân
            </div>
            <h1 className="mt-3 truncate text-xl font-semibold">
              {profileData?.profile?.fullName ||
                effectiveUser?.username ||
                "Tài khoản người dùng"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý thông tin cá nhân, xem lịch sử đăng nhập và bảo vệ tài
              khoản của bạn.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roleLabels.map((role) => (
                <Badge key={role} variant="secondary" className="max-w-full">
                  {role}
                </Badge>
              ))}
              <Badge
                variant={effectiveUser?.verifiedAt ? "default" : "outline"}
                className="max-w-full"
              >
                {effectiveUser?.verifiedAt
                  ? "Email đã xác minh"
                  : "Email chưa xác minh"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="surface min-w-0">
          <CardHeader>
            <CardTitle>Thông tin hồ sơ</CardTitle>
            <CardDescription>
              Cập nhật các trường trong bảng profile để đồng bộ hồ sơ hiển thị
              trên toàn hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleProfileSubmit}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  placeholder="Nguyen Van A"
                  disabled
                  {...profileForm.register("fullName")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  placeholder="https://example.com/avatar.jpg"
                  {...profileForm.register("avatar")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-10"
                    placeholder="0987..."
                    {...profileForm.register("phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Ngày sinh</Label>
                <Input
                  id="birthday"
                  type="date"
                  {...profileForm.register("birthday")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialCommissioningYear">
                  Năm phong/CCĐ lần đầu
                </Label>
                <Input
                  id="initialCommissioningYear"
                  type="number"
                  placeholder="2020"
                  disabled
                  {...profileForm.register("initialCommissioningYear")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedUnit">
                  {DISPLAY_LABELS.assignedUnitTitle} hiển thị
                </Label>
                <Input
                  id="assignedUnit"
                  placeholder="Đại đội 1"
                  disabled
                  {...profileForm.register("assignedUnit")}
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto"
                >
                  <LoadingButtonLabel
                    loading={isSavingProfile}
                    loadingText="Đang cập nhật..."
                    defaultText="Lưu hồ sơ"
                  />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="surface">
            <CardHeader>
              <CardTitle>Tài khoản & xác minh</CardTitle>
              <CardDescription>
                Thông tin tài khoản hiện tại và trạng thái bảo mật cơ bản.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {DISPLAY_LABELS.username}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {effectiveUser?.username || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Email đăng nhập
                </p>
                <p className="mt-1 flex items-start gap-2 text-sm font-medium break-all">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {effectiveUser?.email || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Đơn vị
                </p>
                <p className="mt-1 text-sm font-medium">
                  {effectiveUser?.unit?.name || "Chưa gán đơn vị"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Xác minh email
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  {effectiveUser?.verifiedAt
                    ? `Đã xác minh lúc ${formatDateTime(effectiveUser.verifiedAt)}`
                    : "Chưa xác minh"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="surface">
            <CardHeader>
              <CardTitle>{pendingMeta.title}</CardTitle>
              <CardDescription>{pendingMeta.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <PasswordInput
                  name="currentPassword"
                  label="Mật khẩu hiện tại"
                  register={passwordForm.register}
                  error={passwordForm.formState.errors.currentPassword}
                />
                <PasswordInput
                  name="newPassword"
                  label="Mật khẩu mới"
                  register={passwordForm.register}
                  error={passwordForm.formState.errors.newPassword}
                />
                <PasswordInput
                  name="confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  register={passwordForm.register}
                  error={passwordForm.formState.errors.confirmPassword}
                />
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-3 text-sm text-muted-foreground">
                  Email xác minh đổi mật khẩu có hiệu lực trong 2 giờ. Khi xác
                  minh thành công, toàn bộ thiết bị khác sẽ bị đăng xuất.
                </div>
                <Button
                  type="submit"
                  disabled={pendingMeta.disabled || isRequestingPasswordChange}
                  className="w-full"
                >
                  <LoadingButtonLabel
                    loading={isRequestingPasswordChange}
                    loadingText="Đang gửi email..."
                    defaultText={pendingMeta.buttonText}
                  />
                </Button>
                {passwordStatus?.isPending ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelPasswordChange}
                    disabled={isCancellingPasswordChange}
                    className="w-full"
                  >
                    <LoadingButtonLabel
                      loading={isCancellingPasswordChange}
                      loadingText="Đang hủy yêu cầu..."
                      defaultText="Hủy yêu cầu đổi mật khẩu"
                    />
                  </Button>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <Card className="surface">
            <CardHeader>
              <CardTitle>Thông tin đăng nhập</CardTitle>
              <CardDescription>
                Danh sách các thiết bị còn phiên đăng nhập hoạt động. IP được
                lấy từ kết nối thật của client phía trước Cloudflare.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSession ? (
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Phiên hiện tại</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {currentSession.userAgent || "Không xác định thiết bị"}
                      </p>
                    </div>
                    <Badge>Hiện tại</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        IP
                      </p>
                      <p className="mt-1 flex items-start gap-2 text-sm font-medium break-all">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {currentSession.ip || "Không xác định"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Đăng nhập lúc
                      </p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {formatDateTime(currentSession.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : isSessionsLoading ? (
                <SectionLoader
                  label="Đang tải thông tin phiên đăng nhập..."
                  className="p-4"
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-4 text-sm text-muted-foreground">
                  Chưa có phiên đăng nhập hoạt động nào được ghi nhận.
                </div>
              )}

              {sessions.length > 0 && (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="flex items-start gap-2 text-sm font-medium">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="break-words">
                            {session.userAgent || "Không xác định thiết bị"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {session.ip || "Không xác định IP"} • Hết hạn{" "}
                          {formatDateTime(session.expiresAt)}
                        </p>
                      </div>
                      {session.isCurrent ? (
                        <Badge variant="secondary">Hiện tại</Badge>
                      ) : (
                        <Badge variant="outline">Thiết bị khác</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="surface">
            <CardHeader>
              <CardTitle>Quyền tài khoản</CardTitle>
              <CardDescription>
                Nhóm vai trò hiện được gán cho tài khoản của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {roleLabels.map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {role}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
