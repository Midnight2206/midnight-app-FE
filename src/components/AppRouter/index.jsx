import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { PageLoader } from "@/components/AppLoading";

import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Post from "@/pages/Post";
import NotFound from "@/pages/NotFound";

import {
  ACCESS_RULES,
  PERMISSION_PREFIXES,
  canAccessByRule,
} from "@/features/auth/authorization";

const Category = lazy(() => import("@/pages/Category"));
const MilitaryPage = lazy(() => import("@/pages/Military"));
const AdminCreatePage = lazy(() => import("@/pages/AdminCreate"));
const AccountManagementPage = lazy(() => import("@/pages/AccountManagement"));
const AccountAuditPage = lazy(() => import("@/pages/AccountAudit"));
const AccessControlPage = lazy(() => import("@/pages/AccessControl"));
const SizeRegistrationPage = lazy(() => import("@/pages/SizeRegistration"));
const BackupRecoveryPage = lazy(() => import("@/pages/BackupRecovery"));
const InventoryPage = lazy(() => import("@/pages/Inventory"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmail"));
const VerifyPasswordChangePage = lazy(() => import("@/pages/VerifyPasswordChange"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const ProfilePage = lazy(() => import("@/pages/Profile"));

function DashboardLandingRedirect() {
  const user = useSelector((state) => state.auth.user);

  if (
    canAccessByRule(user, {
      ...ACCESS_RULES.accountDashboardPage,
      anyPermissionPrefixes: [PERMISSION_PREFIXES.ACCOUNTS],
    })
  ) {
    return <Navigate to="/dashboard/accounts/create" replace />;
  }

  if (canAccessByRule(user, ACCESS_RULES.accessControlPage)) {
    return <Navigate to="/dashboard/access" replace />;
  }

  if (canAccessByRule(user, ACCESS_RULES.backupRecoveryPage)) {
    return <Navigate to="/dashboard/backups" replace />;
  }

  return <Navigate to="/" replace />;
}

function RouteFallback() {
  return (
    <PageLoader
      title="Đang tải trang..."
      description="Hệ thống đang nạp module chức năng."
      className="min-h-[50vh]"
    />
  );
}

const guardedFeatureRoutes = [
  {
    path: "/categories",
    element: <Category />,
    accessRule: ACCESS_RULES.categoryPage,
  },
  {
    path: "/size-registrations",
    element: <SizeRegistrationPage />,
    accessRule: ACCESS_RULES.sizeRegistrationPage,
  },
  {
    path: "/militaries",
    element: <MilitaryPage />,
    accessRule: ACCESS_RULES.militaryPage,
  },
  {
    path: "/inventories",
    element: <InventoryPage />,
    accessRule: ACCESS_RULES.inventoryPage,
  },
  {
    path: "/dashboard/access",
    element: <AccessControlPage />,
    accessRule: ACCESS_RULES.accessControlPage,
  },
];

const accountDashboardRoutes = [
  {
    path: "/dashboard/accounts/create",
    element: <AdminCreatePage />,
  },
  {
    path: "/dashboard/accounts/manage",
    element: <AccountManagementPage />,
  },
  {
    path: "/dashboard/accounts/audits",
    element: <AccountAuditPage />,
  },
];

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        richColors
        toastOptions={{
          style: {
            borderRadius: "12px",
          },
          classNames: {
            success: "bg-green-600 text-white",
            error: "bg-red-600 text-white",
            info: "bg-blue-600 text-white",
            warning: "bg-yellow-500 text-black",
          },
        }}
      />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/verify-password-change" element={<VerifyPasswordChangePage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/posts" element={<Post />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<DashboardLandingRedirect />} />

              {guardedFeatureRoutes.map((route) => (
                <Route
                  key={route.path}
                  element={<ProtectedRoute accessRule={route.accessRule} />}
                >
                  <Route path={route.path} element={route.element} />
                </Route>
              ))}

              <Route
                element={
                  <ProtectedRoute
                    accessRule={{
                      ...ACCESS_RULES.accountDashboardPage,
                      anyPermissionPrefixes: [PERMISSION_PREFIXES.ACCOUNTS],
                    }}
                  />
                }
              >
                <Route
                  path="/dashboard/accounts"
                  element={<Navigate to="/dashboard/accounts/create" replace />}
                />
                {accountDashboardRoutes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
              </Route>

              <Route
                element={<ProtectedRoute accessRule={ACCESS_RULES.backupRecoveryPage} />}
              >
                <Route path="/dashboard/backups" element={<BackupRecoveryPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
