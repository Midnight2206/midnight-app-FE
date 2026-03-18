import { useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButtonLabel, SectionLoader } from "@/components/AppLoading";
import { Input } from "@/components/ui/input";
import {
  useCreateAdminAccountMutation,
  useGetAccountUnitsQuery,
} from "@/features/account/accountApi";
import { ACCESS_RULES } from "@/features/auth/authorization";
import { useAuthorization } from "@/features/auth/useAuthorization";
import { getApiErrorMessage } from "@/utils/apiError";
import DashboardPageShell from "@/layouts/components/DashboardPageShell";

export default function AdminCreatePage() {
  const { can } = useAuthorization();
  const canAccessAccountDashboard = can(ACCESS_RULES.accountDashboardPage);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    unitId: "",
  });

  const { data: unitsData, isFetching: isFetchingUnits } = useGetAccountUnitsQuery(
    undefined,
    {
      skip: !canAccessAccountDashboard,
    },
  );

  const [createAdmin, { isLoading: isCreating }] =
    useCreateAdminAccountMutation();

  const units = Array.isArray(unitsData?.units) ? unitsData.units : [];
  const selectableUnits = units.filter((unit) => unit.id !== 1);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.username || !form.password || !form.unitId) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      await createAdmin({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        unitId: Number(form.unitId),
      }).unwrap();
      toast.success("Tạo tài khoản admin thành công.");
      setForm({ email: "", username: "", password: "", unitId: "" });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tạo admin thất bại."));
    }
  };

  if (!canAccessAccountDashboard) {
    return (
      <div className="p-6">
        <Card className="p-6 text-sm text-muted-foreground">
          Bạn chưa có quyền truy cập trang tạo tài khoản quản trị.
        </Card>
      </div>
    );
  }

  return (
    <DashboardPageShell
      title="Tạo tài khoản ADMIN"
      description="Khởi tạo tài khoản quản trị mới và gán đơn vị phụ trách ngay trong dashboard hệ thống."
      className="space-y-4 p-4 md:p-6"
    >
      <Card className="space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-semibold">Tạo tài khoản ADMIN</h2>
        {isFetchingUnits && units.length === 0 && (
          <SectionLoader label="Đang tải danh sách đơn vị..." className="p-3" />
        )}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateAdmin}>
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            autoComplete="email"
          />
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, username: e.target.value }))
            }
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            autoComplete="new-password"
          />
          <select
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm md:col-span-2"
            value={form.unitId}
            onChange={(e) => setForm((prev) => ({ ...prev, unitId: e.target.value }))}
            disabled={isFetchingUnits || selectableUnits.length === 0}
          >
            <option value="">{isFetchingUnits ? "Đang tải đơn vị..." : "Chọn đơn vị"}</option>
            {selectableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.id} - {unit.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground md:col-span-2">
            Lưu ý: mật khẩu nên có tối thiểu 8 ký tự để đảm bảo an toàn.
          </p>
          <div className="md:col-span-2">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={
                isCreating ||
                isFetchingUnits ||
                selectableUnits.length === 0 ||
                !form.email.trim() ||
                !form.username.trim() ||
                !form.password ||
                !form.unitId
              }
            >
              <LoadingButtonLabel loading={isCreating} loadingText="Đang tạo ADMIN..." defaultText="Tạo ADMIN" />
            </Button>
          </div>
        </form>
      </Card>
    </DashboardPageShell>
  );
}
