import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLoader } from "@/components/AppLoading";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  useGetMyRegistrationContextQuery,
  useGetRegistrationPeriodsQuery,
  useGetRegistrationRequestsQuery,
  useReviewRegistrationRequestMutation,
  useSubmitMyRegistrationRequestMutation,
  useUpsertRegistrationPeriodMutation,
} from "@/features/sizeRegistration/sizeRegistrationApi";
import { useGetMilitaryRegistrationYearsQuery } from "@/features/military/militaryApi";
import { useAuthorization } from "@/features/auth/useAuthorization";

const SIZE_REGISTRATION_PERMISSIONS = {
  USER_CONTEXT: "GET /api/size-registrations/my/context",
  USER_SUBMIT: "POST /api/size-registrations/my/requests",
  ADMIN_PERIODS_GET: "GET /api/size-registrations/periods",
  ADMIN_PERIODS_PUT: "PUT /api/size-registrations/periods/:id",
  ADMIN_REQUESTS_GET: "GET /api/size-registrations/requests",
  ADMIN_REQUESTS_REVIEW: "PATCH /api/size-registrations/requests/:id/review",
};

function UserRegistrationPanel({ year, canSubmitPermission }) {
  const [submitNote, setSubmitNote] = useState("");
  const [selectedByCategory, setSelectedByCategory] = useState({});

  const { data, isLoading, refetch } = useGetMyRegistrationContextQuery({ year });
  const [submitRequest, { isLoading: isSubmitting }] =
    useSubmitMyRegistrationRequestMutation();

  const categories = data?.categories || [];
  const currentRegs = useMemo(() => data?.registrations || [], [data?.registrations]);
  const period = data?.period;
  const pendingRequest = data?.pendingRequest;
  const registrationEligibility = data?.registrationEligibility;
  const hasRegisterableCategories = categories.length > 0;

  const initialMap = useMemo(() => {
    const map = {};
    for (const item of currentRegs) {
      map[String(item.categoryId)] = String(item.sizeId);
    }
    return map;
  }, [currentRegs]);

  useEffect(() => {
    setSelectedByCategory(initialMap);
  }, [initialMap]);

  const isEligible = registrationEligibility?.isEligible ?? true;
  const canSubmit =
    canSubmitPermission &&
    period?.status === "OPEN" &&
    !pendingRequest &&
    isEligible &&
    hasRegisterableCategories;

  const handleSelect = (categoryId, sizeId) => {
    setSelectedByCategory((prev) => {
      const next = { ...prev };
      if (!sizeId) {
        delete next[String(categoryId)];
      } else {
        next[String(categoryId)] = String(sizeId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const registrations = Object.entries(selectedByCategory).map(
      ([categoryId, sizeId]) => ({
        categoryId: Number(categoryId),
        sizeId: Number(sizeId),
      }),
    );

    try {
      await submitRequest({
        year,
        note: submitNote.trim() || undefined,
        registrations,
      }).unwrap();
      toast.success("Đã gửi yêu cầu đăng ký cỡ số.");
      setSubmitNote("");
      await refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Gửi yêu cầu thất bại."));
    }
  };

  if (isLoading) {
    return <SectionLoader label="Đang tải dữ liệu đăng ký..." />;
  }

  return (
    <Card className="surface p-4 space-y-3">
      <h3 className="font-semibold">Đăng ký cỡ số năm {year}</h3>
      <p className="text-sm text-muted-foreground">
        Trạng thái đợt đăng ký:{" "}
        <span className={period?.status === "OPEN" ? "text-green-600" : "text-red-600"}>
          {period?.status === "OPEN" ? "Đang mở" : "Đang khóa"}
        </span>
      </p>

      {pendingRequest && (
        <p className="text-sm text-amber-700">
          Bạn đã có yêu cầu chờ duyệt từ {new Date(pendingRequest.submittedAt).toLocaleString()}.
        </p>
      )}
      {!isEligible && (
        <p className="text-sm text-rose-600">
          {registrationEligibility?.message ||
            "Bạn không thể đăng ký cỡ số trong thời gian chuyển đơn vị."}
        </p>
      )}
      {!hasRegisterableCategories && (
        <p className="text-sm text-muted-foreground">
          Không có danh mục cần đăng ký cỡ số (onesize sẽ được bỏ qua).
        </p>
      )}

      <div className="max-h-[48vh] overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 text-left">Danh mục</th>
              <th className="px-3 py-2 text-left">Cỡ số</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const selectedSizeId = selectedByCategory[String(category.id)] || "";
              return (
                <tr key={category.id} className="border-t">
                  <td className="px-3 py-2">{category.name}</td>
                  <td className="px-3 py-2">
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2"
                      value={selectedSizeId}
                      onChange={(e) => handleSelect(category.id, e.target.value)}
                      disabled={!canSubmit}
                    >
                      <option value="">Chưa đăng ký</option>
                      {(category.sizes || []).map((size) => (
                        <option key={size.id} value={String(size.id)}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Input
        value={submitNote}
        onChange={(e) => setSubmitNote(e.target.value)}
        placeholder="Ghi chú cho admin (không bắt buộc)"
        disabled={!canSubmit}
      />
      <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu duyệt"}
      </Button>
    </Card>
  );
}

function AdminReviewPanel({
  year,
  canViewPeriods,
  canManagePeriods,
  canViewRequests,
  canReviewRequests,
}) {
  const { data: periodsData, refetch: refetchPeriods } = useGetRegistrationPeriodsQuery(undefined, {
    skip: !canViewPeriods,
  });
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useGetRegistrationRequestsQuery(
    { year, status: "PENDING", page: 1, limit: 50 },
    {
      skip: !canViewRequests,
    },
  );
  const [upsertPeriod, { isLoading: isSavingPeriod }] = useUpsertRegistrationPeriodMutation();
  const [reviewRequest, { isLoading: isReviewing }] = useReviewRegistrationRequestMutation();

  const periods = periodsData?.periods || [];
  const selectedPeriod = periods.find((item) => item.year === year);
  const pendingRequests = requestsData?.requests || [];

  const changePeriodStatus = async (status) => {
    if (!canManagePeriods) return;
    try {
      await upsertPeriod({
        year,
        status,
      }).unwrap();
      toast.success(`Đã ${status === "OPEN" ? "mở" : "khóa"} đợt đăng ký năm ${year}.`);
      await Promise.all([refetchPeriods(), refetchRequests()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cập nhật đợt đăng ký thất bại."));
    }
  };

  const handleReview = async (requestId, action) => {
    if (!canReviewRequests) return;
    try {
      await reviewRequest({
        requestId,
        action,
      }).unwrap();
      toast.success(action === "APPROVE" ? "Đã duyệt yêu cầu." : "Đã từ chối yêu cầu.");
      await refetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Duyệt yêu cầu thất bại."));
    }
  };

  return (
    <Card className="surface p-4 space-y-3">
      <h3 className="font-semibold">Quản trị đợt đăng ký năm {year}</h3>
      <p className="text-sm text-muted-foreground">
        Trạng thái hiện tại:{" "}
        <span className={selectedPeriod?.status === "OPEN" ? "text-green-600" : "text-red-600"}>
          {selectedPeriod?.status || "LOCKED"}
        </span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={!canManagePeriods || isSavingPeriod}
          onClick={() => changePeriodStatus("OPEN")}
        >
          Mở đợt năm này
        </Button>
        <Button
          variant="outline"
          disabled={!canManagePeriods || isSavingPeriod}
          onClick={() => changePeriodStatus("LOCKED")}
        >
          Khóa đợt năm này
        </Button>
      </div>

      {!canViewRequests ? (
        <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
          Bạn chưa có quyền xem danh sách yêu cầu đăng ký cỡ số.
        </div>
      ) : isLoadingRequests ? (
        <SectionLoader label="Đang tải yêu cầu chờ duyệt..." />
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Yêu cầu chờ duyệt: {pendingRequests.length}
          </p>
          <div className="max-h-[42vh] overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-3 py-2 text-left">Quân nhân</th>
                  <th className="px-3 py-2 text-left">Tài khoản gửi</th>
                  <th className="px-3 py-2 text-left">Số danh mục</th>
                  <th className="px-3 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
                      Không có yêu cầu chờ duyệt.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((request) => (
                    <tr key={request.id} className="border-t">
                      <td className="px-3 py-2">
                        {request.military?.fullname} ({request.military?.militaryCode})
                      </td>
                      <td className="px-3 py-2">{request.submittedBy?.username}</td>
                      <td className="px-3 py-2">{request.items?.length || 0}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={!canReviewRequests || isReviewing}
                            onClick={() => handleReview(request.id, "APPROVE")}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canReviewRequests || isReviewing}
                            onClick={() => handleReview(request.id, "REJECT")}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SizeRegistrationPage() {
  const { hasRole, hasPermission } = useAuthorization();
  const canViewUserPanel = hasPermission([SIZE_REGISTRATION_PERMISSIONS.USER_CONTEXT]);
  const canSubmitUserRequest = hasPermission([SIZE_REGISTRATION_PERMISSIONS.USER_SUBMIT]);
  const canViewPeriods = hasPermission([SIZE_REGISTRATION_PERMISSIONS.ADMIN_PERIODS_GET]);
  const canManagePeriods = hasPermission([SIZE_REGISTRATION_PERMISSIONS.ADMIN_PERIODS_PUT]);
  const canViewRequests = hasPermission([SIZE_REGISTRATION_PERMISSIONS.ADMIN_REQUESTS_GET]);
  const canReviewRequests = hasPermission([SIZE_REGISTRATION_PERMISSIONS.ADMIN_REQUESTS_REVIEW]);
  const canUseUserPanel = hasRole(["USER"]) && canViewUserPanel;
  const canUseAdminPanel =
    canViewPeriods || canManagePeriods || canViewRequests || canReviewRequests;
  const { data: registrationYearsData } = useGetMilitaryRegistrationYearsQuery();
  const yearOptions = useMemo(() => {
    const years = Array.isArray(registrationYearsData?.years)
      ? registrationYearsData.years.map((item) => item.year)
      : [];
    if (years.length > 0) return years;
    return [new Date().getFullYear()];
  }, [registrationYearsData]);
  const [year, setYear] = useState(new Date().getFullYear());
  const selectedYear = yearOptions.includes(year)
    ? year
    : (yearOptions[0] || new Date().getFullYear());

  return (
    <div className="space-y-4">
      <Card className="surface p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Năm đăng ký</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={String(selectedYear)}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((item) => (
              <option key={item} value={String(item)}>
                Năm {item}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {canUseUserPanel && (
        <UserRegistrationPanel
          year={selectedYear}
          canSubmitPermission={canSubmitUserRequest}
        />
      )}
      {canUseAdminPanel && (
        <AdminReviewPanel
          year={selectedYear}
          canViewPeriods={canViewPeriods}
          canManagePeriods={canManagePeriods}
          canViewRequests={canViewRequests}
          canReviewRequests={canReviewRequests}
        />
      )}

      {!canUseUserPanel && !canUseAdminPanel && (
        <Card className="surface p-4 text-sm text-muted-foreground">
          Tài khoản của bạn chưa được cấp quyền cho chức năng đăng ký cỡ số.
        </Card>
      )}
    </div>
  );
}
