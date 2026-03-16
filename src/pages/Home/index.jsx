import {
  Truck,
  Package,
  ArrowRight,
  Warehouse,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/card";
import { ACCESS_RULES, canAccessByRule } from "@/features/auth/authorization";
import { getRememberedMilitaryPath } from "@/features/military/navigation";
import {
  userQuickActions,
  privilegedQuickActions,
} from "@/pages/Home/homeActions.config";

function getVisiblePrivilegedActions(user) {
  return privilegedQuickActions.filter((item) =>
    canAccessByRule(user, item.accessRule),
  );
}

export default function Home() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const rememberedMilitaryPath = getRememberedMilitaryPath(user?.id);

  const canAccessMilitary = canAccessByRule(user, ACCESS_RULES.militaryPage);
  const visiblePrivilegedActions = getVisiblePrivilegedActions(user);

  return (
    <div className="space-y-6">
      <section className="surface relative overflow-hidden p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.15),transparent_32%)]" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            Trung tâm điều phối hậu cần
          </p>

          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            Quản trị hậu cần nhanh hơn,
            <span className="text-primary"> rõ ràng hơn</span>
          </h1>

          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Theo dõi quân nhân, danh mục quân trang, phân quyền tài khoản và vận hành dữ liệu
            trên một dashboard thống nhất cho toàn đơn vị.
          </p>

          {!isAuthenticated ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Đăng nhập hệ thống
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to={canAccessMilitary ? rememberedMilitaryPath : "/categories"}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-5 py-3 text-sm font-semibold transition hover:bg-accent"
            >
              Mở dashboard làm việc
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Feature
          icon={<Package className="h-5 w-5" />}
          title="Quản lý đơn hàng"
          desc="Theo dõi yêu cầu cấp phát và tình trạng xử lý theo thời gian thực."
        />
        <Feature
          icon={<Truck className="h-5 w-5" />}
          title="Vận chuyển"
          desc="Cập nhật luồng giao nhận và kiểm soát tiến độ giao hàng."
        />
        <Feature
          icon={<Warehouse className="h-5 w-5" />}
          title="Kho & hậu cần"
          desc="Giám sát tồn kho, luân chuyển và phân bổ quân trang theo đơn vị."
        />
        <Feature
          icon={<ClipboardList className="h-5 w-5" />}
          title="Nghiệp vụ"
          desc="Chuẩn hóa quy trình vận hành, giảm sai sót thao tác thủ công."
        />
      </section>

      {isAuthenticated && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {visiblePrivilegedActions.length > 0
              ? visiblePrivilegedActions.map((item) => (
                  <QuickAction
                    key={item.key}
                    icon={item.icon}
                    title={item.title}
                    desc={item.desc}
                    to={item.to === "/militaries" ? rememberedMilitaryPath : item.to}
                  />
                ))
              : userQuickActions.map((item) => (
                  <QuickAction
                    key={item.key}
                    icon={item.icon}
                    title={item.title}
                    desc={item.desc}
                    to={item.to}
                  />
                ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <Card className="surface p-5">
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}

function QuickAction({ icon, title, desc, to }) {
  return (
    <Link
      to={to}
      className="surface block rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
