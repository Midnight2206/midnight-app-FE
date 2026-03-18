import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import { getApiErrorMessage } from "@/utils/apiError";
import { getPaginationMeta } from "@/utils/pagination";
import {
  useAcceptTransferRequestMutation,
  useCreateCutTransferRequestMutation,
  useCreateMilitaryAssignedUnitMutation,
  useCreateMilitaryRegistrationYearMutation,
  useCreateMilitaryTypeMutation,
  useCreateMilitaryUnitMutation,
  useDeleteMilitaryAssignedUnitMutation,
  useDeleteMilitaryTypeMutation,
  useDownloadMilitaryTemplateMutation,
  useDownloadRegistrationTemplateMutation,
  useGetMilitaryAssignedUnitsQuery,
  useGetIncomingTransferRequestsQuery,
  useGetMilitariesQuery,
  useGetMilitaryRegistrationOptionsQuery,
  useGetMilitaryRegistrationYearsQuery,
  useGetMilitaryRegistrationsQuery,
  useGetMilitaryTypesQuery,
  useGetMilitaryUnitsQuery,
  useImportMilitariesMutation,
  useImportMilitaryRegistrationsMutation,
  usePreviewMilitaryRegistrationsImportMutation,
  useResetMilitariesMutation,
  useTransferMilitaryAssuranceMutation,
  useUndoCutTransferRequestMutation,
  useUpdateMilitaryAssignedUnitMutation,
  useUpdateMilitaryRegistrationsMutation,
} from "@/features/military/militaryApi";
import { MILITARY_LAST_QUERY_STORAGE_KEY_PREFIX } from "@/features/military/navigation";
import { useUpsertRegistrationPeriodMutation } from "@/features/sizeRegistration/sizeRegistrationApi";
import { ACCESS_RULES, ROLE_NAMES } from "@/features/auth/authorization";
import { useAuthorization } from "@/features/auth/useAuthorization";
import usePersistentTab from "@/hooks/usePersistentTab";
import { useSearchParams } from "react-router-dom";
import MilitarySizeRegistrationDialog from "./MilitarySizeRegistrationDialog";
import MilitaryChangeTable from "./components/MilitaryChangeTable";
import MilitaryImportDialog from "./components/MilitaryImportDialog";
import RegistrationImportDialog from "./components/RegistrationImportDialog";
import CutTransferDialog from "./components/CutTransferDialog";
import MilitaryListTab from "./components/MilitaryListTab";
import IncreaseListTab from "./components/IncreaseListTab";
import MilitarySizeListTab from "./components/MilitarySizeListTab";
import MilitaryHeaderPanel from "./components/MilitaryHeaderPanel";
import AssignedUnitManagementTab from "./components/AssignedUnitManagementTab";
import {
  filterIncreaseRows,
  getIncomingTransferRequests,
  getIncomingTransferRequestsByYear,
  getMergedIncreaseRows,
  getMilitaryRows,
  getRegistrationCategories,
  getSizeTableCategories,
  getTransferTargetUnits,
  getYearOptions,
} from "./utils";
import { useMilitaryActions } from "./hooks/useMilitaryActions";
import { useMilitaryEffects } from "./hooks/useMilitaryEffects";

const QUICK_FILTER_VALUES = new Set(["all", "pending", "accepted"]);
const PAGE_LIMIT_VALUES = new Set([10, 20, 50]);
const SORT_KEY_VALUES = new Set([
  "fullname",
  "militaryCode",
  "initialCommissioningYear",
  "rank",
  "gender",
  "type",
  "position",
  "unit",
  "claim",
]);
const SORT_DIRECTION_VALUES = new Set(["asc", "desc"]);
const DEFAULT_SORT_KEY = "fullname";
const DEFAULT_SORT_DIRECTION = "asc";
const DEFAULT_LIMIT = 20;

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseYearInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed < 1900 || parsed > 3000) return fallback;
  return parsed;
}

export default function MilitaryPage() {
  const { confirm } = useConfirmDialog();
  const { user, can, hasRole } = useAuthorization();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  const isSuperAdmin = hasRole([ROLE_NAMES.SUPER_ADMIN]);
  const canAccess = can(ACCESS_RULES.militaryPage);
  const canOperateUnitAssurance = canAccess && !isSuperAdmin;
  const canRegisterSizes = canOperateUnitAssurance;
  const canManageTransfer = canOperateUnitAssurance;
  const canManageRegistrationPeriod = canAccess;
  const isApplyingUrlRef = useRef(false);
  const hasInitializedQueryFromStorageRef = useRef(false);

  const [selectedUnitId, setSelectedUnitId] = useState(
    () => String(searchParams.get("unitId") || "").trim(),
  );
  const [newUnitName, setNewUnitName] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [searchInput, setSearchInput] = useState(
    () => String(searchParams.get("q") || "").trim(),
  );
  const [searchTerm, setSearchTerm] = useState(
    () => String(searchParams.get("q") || "").trim(),
  );
  const [selectedType, setSelectedType] = useState(
    () => String(searchParams.get("type") || "").trim(),
  );
  const [militaryImportType, setMilitaryImportType] = useState("");
  const [newTypeCode, setNewTypeCode] = useState("");
  const [page, setPage] = useState(() => parsePositiveInt(searchParams.get("page"), 1));
  const [limit, setLimit] = useState(() => {
    const parsedLimit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
    return PAGE_LIMIT_VALUES.has(parsedLimit) ? parsedLimit : DEFAULT_LIMIT;
  });
  const [sortConfig, setSortConfig] = useState(() => {
    const key = String(searchParams.get("sortBy") || "").trim();
    const direction = String(searchParams.get("sortDir") || "")
      .trim()
      .toLowerCase();
    return {
      key: SORT_KEY_VALUES.has(key) ? key : DEFAULT_SORT_KEY,
      direction: SORT_DIRECTION_VALUES.has(direction)
        ? direction
        : DEFAULT_SORT_DIRECTION,
    };
  });
  const [openListHeaderFilters, setOpenListHeaderFilters] = useState(
    () => String(searchParams.get("filters") || "") === "1",
  );
  const [activeViewTab, setActiveViewTab] = usePersistentTab(
    "military_active_view_tab",
    "military-list",
    ["military-list", "size-list", "increase-list", "decrease-list", "assigned-unit-list"],
  );
  const [increaseQuickFilter, setIncreaseQuickFilter] = useState(() => {
    const value = String(searchParams.get("increase") || "")
      .trim()
      .toLowerCase();
    return QUICK_FILTER_VALUES.has(value) ? value : "all";
  });
  const [selectedYear, setSelectedYear] = useState(() =>
    parseYearInt(searchParams.get("year"), currentYear),
  );
  const [openRegistrationDialog, setOpenRegistrationDialog] = useState(false);
  const [selectedMilitary, setSelectedMilitary] = useState(null);
  const [registrationTemplateIncludeExisting, setRegistrationTemplateIncludeExisting] =
    useState(true);
  const [registrationImportKeepExisting, setRegistrationImportKeepExisting] = useState(true);
  const [newRegistrationYear, setNewRegistrationYear] = useState(new Date().getFullYear() + 1);
  const [registrationImportFile, setRegistrationImportFile] = useState(null);
  const [selectedRegistrationCategoryIds, setSelectedRegistrationCategoryIds] = useState([]);
  const [registrationImportPreview, setRegistrationImportPreview] = useState(null);
  const [openCutTransferDialog, setOpenCutTransferDialog] = useState(false);
  const [cutTransferMilitary, setCutTransferMilitary] = useState(null);
  const [cutTransferTypeId, setCutTransferTypeId] = useState("");
  const [cutTransferTargetUnitId, setCutTransferTargetUnitId] = useState("");
  const [cutTransferYear, setCutTransferYear] = useState(() => new Date().getFullYear());
  const [cutTransferNote, setCutTransferNote] = useState("");
  const [openMilitaryImportDialog, setOpenMilitaryImportDialog] = useState(false);
  const [openRegistrationImportDialog, setOpenRegistrationImportDialog] = useState(false);
  const [militaryImportReport, setMilitaryImportReport] = useState(null);
  const [externalIncreaseForm, setExternalIncreaseForm] = useState({
    militaryCode: "",
    fullname: "",
    rank: "",
    gender: "",
    type: "",
    position: "",
    assignedUnitId: "",
    initialCommissioningYear: "",
    fromExternalUnitName: "",
    transferYear: "",
    note: "",
  });

  const unitScopeKey = isSuperAdmin ? "superadmin" : "admin";
  const { data: unitsData, refetch: refetchUnits } = useGetMilitaryUnitsQuery(unitScopeKey, {
    skip: !canAccess,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const units = Array.isArray(unitsData?.units) ? unitsData.units : [];
  const { data: allUnitsData } = useGetMilitaryUnitsQuery("all", {
    skip: !canManageTransfer,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const allUnits = useMemo(
    () => (Array.isArray(allUnitsData?.units) ? allUnitsData.units : []),
    [allUnitsData],
  );
  const adminUnit = !isSuperAdmin ? units[0] : null;
  const currentAdminUnitId = Number(adminUnit?.id || user?.unitId || 0);
  const currentAdminUnitName = String(adminUnit?.name || user?.unit?.name || "").trim();
  const selectedScopeUnitId = useMemo(() => {
    if (isSuperAdmin) {
      const parsed = Number(selectedUnitId);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
    const parsed = Number(adminUnit?.id || user?.unitId || 0);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [adminUnit?.id, isSuperAdmin, selectedUnitId, user?.unitId]);
  const selectedScopeUnitName = useMemo(() => {
    if (isSuperAdmin) {
      const matched = units.find((item) => Number(item.id) === Number(selectedUnitId));
      return matched?.name || "";
    }
    return String(adminUnit?.name || user?.unit?.name || "").trim();
  }, [adminUnit?.name, isSuperAdmin, selectedUnitId, units, user?.unit?.name]);
  const assignedUnitsQueryArg = useMemo(
    () => (selectedScopeUnitId ? { unitId: selectedScopeUnitId } : undefined),
    [selectedScopeUnitId],
  );
  const {
    data: assignedUnitsData,
    error: assignedUnitsError,
    isLoading: isLoadingAssignedUnits,
    isFetching: isFetchingAssignedUnits,
    refetch: refetchAssignedUnits,
  } = useGetMilitaryAssignedUnitsQuery(assignedUnitsQueryArg, {
    skip: !assignedUnitsQueryArg,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const { data: yearsData, refetch: refetchYears } = useGetMilitaryRegistrationYearsQuery(undefined, {
    skip: !canAccess,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const registrationYears = useMemo(
    () => (Array.isArray(yearsData?.years) ? yearsData.years : []),
    [yearsData],
  );
  const yearOptions = useMemo(() => getYearOptions(registrationYears), [registrationYears]);
  const yearStatusMap = useMemo(
    () => new Map(registrationYears.map((item) => [item.year, item.status])),
    [registrationYears],
  );
  const { data: militaryTypesData, refetch: refetchMilitaryTypes } = useGetMilitaryTypesQuery(
    undefined,
    {
      skip: !canAccess,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const militaryTypes = useMemo(
    () => (Array.isArray(militaryTypesData?.types) ? militaryTypesData.types : []),
    [militaryTypesData],
  );
  const selectedTypeLabel = useMemo(() => {
    if (!selectedType) return "Chưa chọn danh sách";
    return selectedType;
  }, [selectedType]);

  useEffect(() => {
    if (hasInitializedQueryFromStorageRef.current) return;
    if (typeof window === "undefined") {
      hasInitializedQueryFromStorageRef.current = true;
      return;
    }

    const currentRaw = searchParams.toString();
    const storageKey = `${MILITARY_LAST_QUERY_STORAGE_KEY_PREFIX}:${user?.id || "anonymous"}`;

    try {
      if (!currentRaw) {
        const storedRaw = window.localStorage.getItem(storageKey);
        if (storedRaw !== null && storedRaw !== currentRaw) {
          setSearchParams(new URLSearchParams(storedRaw), { replace: true });
          return;
        }
      }
    } catch {
      // Ignore localStorage read/parse errors.
    }

    hasInitializedQueryFromStorageRef.current = true;
  }, [searchParams, setSearchParams, user?.id]);

  useEffect(() => {
    if (!hasInitializedQueryFromStorageRef.current) return;
    if (typeof window === "undefined") return;

    const storageKey = `${MILITARY_LAST_QUERY_STORAGE_KEY_PREFIX}:${user?.id || "anonymous"}`;
    const currentRaw = searchParams.toString();

    try {
      window.localStorage.setItem(storageKey, currentRaw);
    } catch {
      // Ignore localStorage quota/private-mode errors.
    }
  }, [searchParams, user?.id]);

  useEffect(() => {
    const unitId = String(searchParams.get("unitId") || "").trim();
    const type = String(searchParams.get("type") || "").trim();
    const keyword = String(searchParams.get("q") || "").trim();
    const nextPage = parsePositiveInt(searchParams.get("page"), 1);
    const parsedLimit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
    const nextLimit = PAGE_LIMIT_VALUES.has(parsedLimit) ? parsedLimit : DEFAULT_LIMIT;
    const nextSortByRaw = String(searchParams.get("sortBy") || "").trim();
    const nextSortDirRaw = String(searchParams.get("sortDir") || "")
      .trim()
      .toLowerCase();
    const nextSortBy = SORT_KEY_VALUES.has(nextSortByRaw)
      ? nextSortByRaw
      : DEFAULT_SORT_KEY;
    const nextSortDir = SORT_DIRECTION_VALUES.has(nextSortDirRaw)
      ? nextSortDirRaw
      : DEFAULT_SORT_DIRECTION;
    const nextYear = parseYearInt(searchParams.get("year"), currentYear);
    const nextIncreaseRaw = String(searchParams.get("increase") || "")
      .trim()
      .toLowerCase();
    const nextIncrease = QUICK_FILTER_VALUES.has(nextIncreaseRaw)
      ? nextIncreaseRaw
      : "all";
    const nextFiltersOpen = String(searchParams.get("filters") || "") === "1";
    const shouldApplyFromUrl =
      selectedUnitId !== unitId ||
      selectedType !== type ||
      searchInput !== keyword ||
      searchTerm !== keyword ||
      page !== nextPage ||
      limit !== nextLimit ||
      sortConfig.key !== nextSortBy ||
      sortConfig.direction !== nextSortDir ||
      selectedYear !== nextYear ||
      increaseQuickFilter !== nextIncrease ||
      openListHeaderFilters !== nextFiltersOpen;

    if (shouldApplyFromUrl) {
      isApplyingUrlRef.current = true;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedUnitId((prev) => (prev === unitId ? prev : unitId));
    setSelectedType((prev) => (prev === type ? prev : type));
    setSearchInput((prev) => (prev === keyword ? prev : keyword));
    setSearchTerm((prev) => (prev === keyword ? prev : keyword));
    setPage((prev) => (prev === nextPage ? prev : nextPage));
    setLimit((prev) => (prev === nextLimit ? prev : nextLimit));
    setSortConfig((prev) => {
      if (prev.key === nextSortBy && prev.direction === nextSortDir) {
        return prev;
      }
      return { key: nextSortBy, direction: nextSortDir };
    });
    setSelectedYear((prev) => (prev === nextYear ? prev : nextYear));
    setIncreaseQuickFilter((prev) => (prev === nextIncrease ? prev : nextIncrease));
    setOpenListHeaderFilters((prev) => (prev === nextFiltersOpen ? prev : nextFiltersOpen));
  }, [currentYear, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isApplyingUrlRef.current) {
      isApplyingUrlRef.current = false;
      return;
    }

    const next = new URLSearchParams();
    if (selectedUnitId) next.set("unitId", selectedUnitId);
    if (selectedType) next.set("type", selectedType);
    if (searchTerm.trim()) next.set("q", searchTerm.trim());
    if (page > 1) next.set("page", String(page));
    if (limit !== DEFAULT_LIMIT) next.set("limit", String(limit));
    if (sortConfig.key !== DEFAULT_SORT_KEY) next.set("sortBy", sortConfig.key);
    if (sortConfig.direction !== DEFAULT_SORT_DIRECTION) {
      next.set("sortDir", sortConfig.direction);
    }
    if (selectedYear !== currentYear) next.set("year", String(selectedYear));
    if (increaseQuickFilter !== "all") next.set("increase", increaseQuickFilter);
    if (openListHeaderFilters) next.set("filters", "1");

    const nextRaw = next.toString();
    const currentRaw = searchParams.toString();
    if (nextRaw !== currentRaw) {
      setSearchParams(next, { replace: false });
    }
  }, [
    currentYear,
    increaseQuickFilter,
    limit,
    openListHeaderFilters,
    page,
    searchParams,
    searchTerm,
    selectedType,
    selectedUnitId,
    selectedYear,
    setSearchParams,
    sortConfig.direction,
    sortConfig.key,
  ]);

  useEffect(() => {
    if (militaryTypes.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMilitaryImportType("");
      return;
    }

    const typeExists = militaryTypes.some((item) => item.code === selectedType);
    const fallbackType = militaryTypes[0].code;
    const resolvedType = typeExists ? selectedType : fallbackType;

    if (resolvedType !== selectedType) {
      setSelectedType(resolvedType);
      return;
    }

    setMilitaryImportType((prev) => {
      if (prev && militaryTypes.some((item) => item.code === prev)) return prev;
      return resolvedType;
    });
  }, [militaryTypes, selectedType]);

  const queryParams = useMemo(() => {
    const sortByMap = {
      unit: "assignedUnit",
      claim: "claimStatus",
    };
    const params = {
      search: searchTerm.trim() || undefined,
      type: selectedType || undefined,
      sortBy: sortByMap[sortConfig.key] || sortConfig.key,
      sortDir: sortConfig.direction,
      year: selectedYear,
      page,
      limit,
    };

    if (!isSuperAdmin) return params;
    return selectedUnitId ? { ...params, unitId: selectedUnitId } : params;
  }, [isSuperAdmin, limit, page, searchTerm, selectedType, selectedUnitId, selectedYear, sortConfig]);

  const registrationListQueryParams = useMemo(() => {
    const params = {
      year: selectedYear,
      search: searchTerm.trim() || undefined,
      type: selectedType || undefined,
      page,
      limit,
      sortBy: "fullname",
      sortDir: "asc",
      assuranceScope: "year",
    };

    if (!isSuperAdmin) return params;
    return selectedUnitId ? { ...params, unitId: selectedUnitId } : params;
  }, [isSuperAdmin, limit, page, searchTerm, selectedType, selectedUnitId, selectedYear]);

  const { data, isLoading, isFetching, error, refetch } = useGetMilitariesQuery(queryParams, {
    skip: !canAccess,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: registrationListData,
    isLoading: isLoadingRegistrationList,
    isFetching: isFetchingRegistrationList,
    error: registrationListError,
    refetch: refetchRegistrationList,
  } = useGetMilitariesQuery(registrationListQueryParams, {
    skip: !canRegisterSizes,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: registrationOptionsData,
    isLoading: isLoadingRegistrationOptions,
    isFetching: isFetchingRegistrationOptions,
  } = useGetMilitaryRegistrationOptionsQuery(undefined, {
    skip: !canRegisterSizes,
  });

  const {
    data: selectedMilitaryRegistrationsData,
    isLoading: isLoadingSelectedMilitaryRegistrations,
    isFetching: isFetchingSelectedMilitaryRegistrations,
  } = useGetMilitaryRegistrationsQuery(
    {
      militaryId: selectedMilitary?.id,
      year: selectedYear,
    },
    {
      skip: !canRegisterSizes || !selectedMilitary?.id,
    },
  );

  const {
    data: incomingTransferRequestsData,
    isLoading: isLoadingIncomingTransferRequests,
    isFetching: isFetchingIncomingTransferRequests,
    refetch: refetchIncomingTransferRequests,
  } = useGetIncomingTransferRequestsQuery(undefined, {
    skip: !canManageTransfer,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [createUnit, { isLoading: isCreatingUnit }] = useCreateMilitaryUnitMutation();
  const [createMilitaryType, { isLoading: isCreatingType }] = useCreateMilitaryTypeMutation();
  const [deleteMilitaryType, { isLoading: isDeletingType }] = useDeleteMilitaryTypeMutation();
  const [downloadTemplate, { isLoading: isDownloadingTemplate }] =
    useDownloadMilitaryTemplateMutation();
  const [downloadRegistrationTemplate, { isLoading: isDownloadingRegistrationTemplate }] =
    useDownloadRegistrationTemplateMutation();
  const [importMilitaries, { isLoading: isImporting }] = useImportMilitariesMutation();
  const [importMilitaryRegistrations, { isLoading: isImportingRegistrations }] =
    useImportMilitaryRegistrationsMutation();
  const [previewMilitaryRegistrationsImport, { isLoading: isPreviewingRegistrationImport }] =
    usePreviewMilitaryRegistrationsImportMutation();
  const [createMilitaryRegistrationYear, { isLoading: isCreatingRegistrationYear }] =
    useCreateMilitaryRegistrationYearMutation();
  const [resetMilitaries, { isLoading: isResetting }] = useResetMilitariesMutation();
  const [transferMilitaryAssurance, { isLoading: isSubmittingExternalIncrease }] =
    useTransferMilitaryAssuranceMutation();
  const [createMilitaryAssignedUnit, { isLoading: isCreatingAssignedUnit }] =
    useCreateMilitaryAssignedUnitMutation();
  const [updateMilitaryAssignedUnit, { isLoading: isUpdatingAssignedUnit }] =
    useUpdateMilitaryAssignedUnitMutation();
  const [deleteMilitaryAssignedUnit, { isLoading: isDeletingAssignedUnit }] =
    useDeleteMilitaryAssignedUnitMutation();
  const [updateMilitaryRegistrations, { isLoading: isSavingRegistrations }] =
    useUpdateMilitaryRegistrationsMutation();
  const [createCutTransferRequest, { isLoading: isCreatingCutTransferRequest }] =
    useCreateCutTransferRequestMutation();
  const [acceptTransferRequest, { isLoading: isAcceptingTransferRequest }] =
    useAcceptTransferRequestMutation();
  const [undoCutTransferRequest, { isLoading: isUndoingCutTransferRequest }] =
    useUndoCutTransferRequestMutation();
  const [upsertRegistrationPeriod, { isLoading: isUpsertingRegistrationPeriod }] =
    useUpsertRegistrationPeriodMutation();

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    const code = String(newTypeCode || "").trim();
    if (!code) {
      toast.error("Vui lòng nhập mã type.");
      return;
    }

    try {
      await createMilitaryType({ code }).unwrap();
      toast.success("Thêm loại quân nhân thành công.");
      setNewTypeCode("");
      await Promise.all([refetchMilitaryTypes(), refetch()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Thêm loại quân nhân thất bại."));
    }
  };

  const handleDeleteType = async (typeItem) => {
    if (!isSuperAdmin) return;
    const typeId = Number(typeItem?.id || 0);
    if (!Number.isInteger(typeId) || typeId <= 0) return;

    const ok = await confirm({
      title: "Xóa loại quân nhân",
      description: `Bạn chắc chắn muốn xóa loại ${typeItem?.code || ""}?`,
      confirmText: "Xóa loại",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      await deleteMilitaryType({ typeId }).unwrap();
      toast.success("Đã xóa loại quân nhân.");
      if (selectedType === typeItem?.code) {
        setSelectedType("");
      }
      await Promise.all([refetchMilitaryTypes(), refetch()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Xóa loại quân nhân thất bại."));
    }
  };

  const militaries = getMilitaryRows(data);
  const registrationMilitaries = canRegisterSizes
    ? getMilitaryRows(registrationListData)
    : militaries;
  const incomingMilitariesByYear = useMemo(
    () =>
      militaries.filter(
        (item) => Number(item.unitTransferInYear || 0) === Number(selectedYear),
      ),
    [militaries, selectedYear],
  );
  const outgoingMilitariesByYear = useMemo(
    () =>
      militaries.filter((item) => {
        const yearState = item?.yearState || null;
        return (
          yearState?.displayStatus === "transferred" &&
          yearState?.isShowMilitary === true
        );
      }),
    [militaries, selectedYear],
  );
  const claimedCount = militaries.filter((item) => item.claimedByUserId).length;
  const unclaimedCount = Math.max(militaries.length - claimedCount, 0);
  const pagination = getPaginationMeta(data, 20);
  const total = pagination.total;
  const totalPages = pagination.totalPages;
  const currentPage = pagination.page;
  const registrationPagination = getPaginationMeta(registrationListData, 20);
  const registrationTotal = registrationPagination.total;
  const registrationTotalPages = registrationPagination.totalPages;
  const registrationCurrentPage = registrationPagination.page;
  const canImport =
    canOperateUnitAssurance;

  const assignedUnits = useMemo(
    () => (Array.isArray(assignedUnitsData?.assignedUnits) ? assignedUnitsData.assignedUnits : []),
    [assignedUnitsData],
  );
  const incomingTransferRequests = useMemo(
    () => getIncomingTransferRequests(incomingTransferRequestsData),
    [incomingTransferRequestsData],
  );
  const incomingTransferRequestsByYear = useMemo(
    () => getIncomingTransferRequestsByYear(incomingTransferRequests, selectedYear),
    [incomingTransferRequests, selectedYear],
  );
  const mergedIncreaseRows = useMemo(() => {
    return getMergedIncreaseRows(incomingMilitariesByYear, incomingTransferRequestsByYear);
  }, [incomingMilitariesByYear, incomingTransferRequestsByYear]);
  const filteredIncreaseRows = useMemo(() => {
    return filterIncreaseRows(mergedIncreaseRows, increaseQuickFilter);
  }, [increaseQuickFilter, mergedIncreaseRows]);
  const transferTargetUnits = useMemo(() => {
    return getTransferTargetUnits(allUnits, currentAdminUnitId);
  }, [allUnits, currentAdminUnitId]);
  const cutTransferTypeOptions = useMemo(() => {
    if (!Array.isArray(cutTransferMilitary?.typeAssignments)) return [];
    return cutTransferMilitary.typeAssignments
      .map((item) => item?.type)
      .filter((item) => Number.isInteger(Number(item?.id)) && Number(item.id) > 0);
  }, [cutTransferMilitary]);
  const registrationCategories = useMemo(
    () => getRegistrationCategories(registrationOptionsData),
    [registrationOptionsData],
  );
  const sizeTableCategories = useMemo(
    () => getSizeTableCategories(registrationCategories, registrationMilitaries),
    [registrationCategories, registrationMilitaries],
  );

  const handleExternalIncreaseFieldChange = (field, value) => {
    setExternalIncreaseForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetExternalIncreaseForm = () => {
    setExternalIncreaseForm({
      militaryCode: "",
      fullname: "",
      rank: "",
      gender: "",
      type: "",
      position: "",
      assignedUnitId: "",
      initialCommissioningYear: "",
      fromExternalUnitName: "",
      transferYear: "",
      note: "",
    });
  };

  useEffect(() => {
    if (!externalIncreaseForm.assignedUnitId) return;
    const exists = assignedUnits.some(
      (item) => String(item.id) === String(externalIncreaseForm.assignedUnitId),
    );
    if (!exists) {
      setExternalIncreaseForm((prev) => ({ ...prev, assignedUnitId: "" }));
    }
  }, [assignedUnits, externalIncreaseForm.assignedUnitId]);

  const handleSubmitExternalIncrease = async () => {
    if (!canManageTransfer) return;
    if (!Number.isInteger(currentAdminUnitId) || currentAdminUnitId <= 0) {
      toast.error("Không xác định được đơn vị tiếp nhận của tài khoản hiện tại.");
      return;
    }

    const payload = {
      militaryCode: String(externalIncreaseForm.militaryCode || "").trim(),
      fullname: String(externalIncreaseForm.fullname || "").trim(),
      rank: String(externalIncreaseForm.rank || "").trim(),
      gender: String(externalIncreaseForm.gender || "").trim(),
      type: String(externalIncreaseForm.type || "").trim(),
      position: String(externalIncreaseForm.position || "").trim(),
      assignedUnitId: Number(externalIncreaseForm.assignedUnitId),
      initialCommissioningYear: Number(externalIncreaseForm.initialCommissioningYear),
      fromUnitId: null,
      toUnitId: currentAdminUnitId,
      fromExternalUnitName: String(externalIncreaseForm.fromExternalUnitName || "").trim(),
      transferYear: Number(externalIncreaseForm.transferYear),
      note: String(externalIncreaseForm.note || "").trim() || undefined,
    };

    if (!payload.militaryCode) {
      toast.error("Vui lòng nhập mã quân nhân.");
      return;
    }
    if (!payload.fullname) {
      toast.error("Vui lòng nhập họ tên quân nhân.");
      return;
    }
    if (!payload.rank) {
      toast.error("Vui lòng chọn cấp bậc.");
      return;
    }
    if (!payload.gender) {
      toast.error("Vui lòng chọn giới tính.");
      return;
    }
    if (!payload.type) {
      toast.error("Vui lòng chọn loại quân nhân.");
      return;
    }
    if (!payload.position) {
      toast.error("Vui lòng nhập chức vụ.");
      return;
    }
    if (!Number.isInteger(payload.assignedUnitId) || payload.assignedUnitId <= 0) {
      toast.error("Vui lòng chọn assignedUnit tiếp nhận.");
      return;
    }
    if (
      !Number.isInteger(payload.initialCommissioningYear) ||
      payload.initialCommissioningYear < 1900 ||
      payload.initialCommissioningYear > 2100
    ) {
      toast.error("Năm PH, CCĐ lần đầu không hợp lệ.");
      return;
    }
    if (!payload.fromExternalUnitName) {
      toast.error("Vui lòng nhập nguồn chuyển đến ngoài hệ thống.");
      return;
    }
    if (
      !Number.isInteger(payload.transferYear) ||
      payload.transferYear < 1900 ||
      payload.transferYear > 2100
    ) {
      toast.error("Năm chuyển đến không hợp lệ.");
      return;
    }

    try {
      await transferMilitaryAssurance(payload).unwrap();
      toast.success("Đã tiếp nhận quân nhân từ ngoài hệ thống.");
      resetExternalIncreaseForm();
      await Promise.all([refetch(), refetchIncomingTransferRequests(), refetchAssignedUnits()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Tiếp nhận quân nhân thất bại."));
    }
  };

  const handleCreateAssignedUnit = async (name) => {
    if (!selectedScopeUnitId) {
      throw new Error("UNIT_SCOPE_REQUIRED");
    }
    await createMilitaryAssignedUnit({
      name,
      unitId: selectedScopeUnitId,
    }).unwrap();
    await refetchAssignedUnits();
  };

  const handleUpdateAssignedUnit = async ({ assignedUnitId, name }) => {
    if (!selectedScopeUnitId) {
      throw new Error("UNIT_SCOPE_REQUIRED");
    }
    await updateMilitaryAssignedUnit({
      assignedUnitId,
      name,
      unitId: selectedScopeUnitId,
    }).unwrap();
    await refetchAssignedUnits();
  };

  const handleDeleteAssignedUnit = async ({ assignedUnitId }) => {
    if (!selectedScopeUnitId) {
      throw new Error("UNIT_SCOPE_REQUIRED");
    }
    await deleteMilitaryAssignedUnit({
      assignedUnitId,
      unitId: selectedScopeUnitId,
    }).unwrap();
    await refetchAssignedUnits();
  };

  useMilitaryEffects({
    canRegisterSizes,
    registrationCategories,
    setSelectedRegistrationCategoryIds,
    yearOptions,
    selectedYear,
    setSelectedYear,
    setPage,
    setRegistrationImportPreview,
    registrationImportKeepExisting,
    selectedRegistrationCategoryIds,
    searchInput,
    setSearchTerm,
  });

  const {
    handleSort,
    sortLabel,
    handleCreateUnit,
    handleDownloadTemplate,
    handleImport,
    handleToggleRegistrationCategory,
    handleDownloadRegistrationTemplate,
    handleImportRegistrations,
    handlePreviewRegistrationImport,
    handleCreateRegistrationYear,
    handleReset,
    refreshAll,
    handleOpenRegistrationDialog,
    handleCloseRegistrationDialog,
    handleSaveRegistrations,
    handleOpenCutTransferDialog,
    handleSubmitCutTransferRequest,
    handleAcceptTransferRequest,
    handleUndoCutTransferRequest,
    handleChangeRegistrationPeriodStatus,
    isSubmittingCutTransfer,
    isSelectedYearOpen,
  } = useMilitaryActions({
    confirm,
    sortConfig,
    setSortConfig,
    setPage,
    newUnitName,
    createUnit,
    setNewUnitName,
    refetchUnits,
    downloadTemplate,
    canImport,
    importFile,
    militaryImportType,
    importMilitaries,
    setImportFile,
    setMilitaryImportReport,
    refetch,
    setSelectedRegistrationCategoryIds,
    canRegisterSizes,
    selectedRegistrationCategoryIds,
    downloadRegistrationTemplate,
    registrationTemplateIncludeExisting,
    selectedYear,
    registrationImportFile,
    registrationImportPreview,
    registrationImportKeepExisting,
    importMilitaryRegistrations,
    setRegistrationImportFile,
    setRegistrationImportPreview,
    setOpenRegistrationImportDialog,
    previewMilitaryRegistrationsImport,
    isSuperAdmin,
    newRegistrationYear,
    createMilitaryRegistrationYear,
    setSelectedYear,
    refetchYears,
    selectedUnitId,
    resetMilitaries,
    refetchRegistrationList,
    selectedMilitary,
    updateMilitaryRegistrations,
    setOpenRegistrationDialog,
    setSelectedMilitary,
    transferTargetUnits,
    selectedType,
    setCutTransferMilitary,
    setCutTransferTargetUnitId,
    setCutTransferTypeId,
    setCutTransferYear,
    setCutTransferNote,
    setOpenCutTransferDialog,
    cutTransferMilitary,
    cutTransferTypeId,
    cutTransferTargetUnitId,
    cutTransferYear,
    cutTransferNote,
    createCutTransferRequest,
    refetchIncomingTransferRequests,
    acceptTransferRequest,
    undoCutTransferRequest,
    canManageRegistrationPeriod,
    upsertRegistrationPeriod,
    isCreatingCutTransferRequest,
    isAcceptingTransferRequest,
    isUndoingCutTransferRequest,
    yearStatusMap,
  });

  if (!canAccess) {
    return (
      <Card className="surface p-6 text-sm text-muted-foreground">
        Bạn chưa được cấp quyền truy cập trang quân nhân.
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <MilitaryHeaderPanel
          isSuperAdmin={isSuperAdmin}
          newUnitName={newUnitName}
          setNewUnitName={setNewUnitName}
          handleCreateUnit={handleCreateUnit}
          isCreatingUnit={isCreatingUnit}
          units={units}
          selectedUnitId={selectedUnitId}
          setSelectedUnitId={setSelectedUnitId}
          setPage={setPage}
          adminUnit={adminUnit}
          user={user}
          refreshAll={refreshAll}
          isFetching={isFetching}
          handleReset={handleReset}
          isResetting={isResetting}
          canImport={canImport}
          setOpenMilitaryImportDialog={(open) => {
            if (open && selectedType) {
              setMilitaryImportType(selectedType);
            }
            setOpenMilitaryImportDialog(open);
          }}
          canRegisterSizes={canRegisterSizes}
          setOpenRegistrationImportDialog={setOpenRegistrationImportDialog}
          openListHeaderFilters={openListHeaderFilters}
          setOpenListHeaderFilters={setOpenListHeaderFilters}
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          yearStatusMap={yearStatusMap}
          setSelectedYear={setSelectedYear}
          selectedType={selectedType}
          selectedTypeLabel={selectedTypeLabel}
          setSelectedType={setSelectedType}
          militaryTypes={militaryTypes}
          newTypeCode={newTypeCode}
          setNewTypeCode={setNewTypeCode}
          handleCreateType={handleCreateType}
          isCreatingType={isCreatingType}
          handleDeleteType={handleDeleteType}
          isDeletingType={isDeletingType}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          setSearchTerm={setSearchTerm}
          militariesCount={militaries.length}
          claimedCount={claimedCount}
          unclaimedCount={unclaimedCount}
          limit={limit}
          setLimit={setLimit}
        />

        <Tabs value={activeViewTab} onValueChange={setActiveViewTab}>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="inline-flex min-w-max">
              <TabsTrigger value="military-list">Danh sách quân nhân</TabsTrigger>
              <TabsTrigger value="size-list">Danh sách cỡ số theo năm</TabsTrigger>
              <TabsTrigger value="increase-list">Quân nhân tăng</TabsTrigger>
              <TabsTrigger value="decrease-list">Quân nhân giảm</TabsTrigger>
              <TabsTrigger value="assigned-unit-list">Danh mục assignedUnit</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="military-list" className="mt-4">
            <MilitaryListTab
              isLoading={isLoading}
              error={error}
              isFetching={isFetching}
              sortConfig={sortConfig}
              onSort={handleSort}
              sortLabel={sortLabel}
              canManageTransfer={canManageTransfer}
              militaries={militaries}
              searchTerm={searchTerm}
              selectedYear={selectedYear}
              currentAdminUnitId={currentAdminUnitId}
              isSubmittingCutTransfer={isSubmittingCutTransfer}
              onUndoCutTransferRequest={handleUndoCutTransferRequest}
              onOpenCutTransferDialog={handleOpenCutTransferDialog}
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
              focusedTypeCode={selectedType}
            />
          </TabsContent>

          <TabsContent value="size-list" className="mt-4">
            <MilitarySizeListTab
              isSuperAdmin={isSuperAdmin}
              newRegistrationYear={newRegistrationYear}
              setNewRegistrationYear={setNewRegistrationYear}
              handleCreateRegistrationYear={handleCreateRegistrationYear}
              isCreatingRegistrationYear={isCreatingRegistrationYear}
              isLoadingRegistrationList={isLoadingRegistrationList}
              sizeTableCategories={sizeTableCategories}
              registrationListError={registrationListError}
              isFetchingRegistrationList={isFetchingRegistrationList}
              selectedYear={selectedYear}
              canManageRegistrationPeriod={canManageRegistrationPeriod}
              isUpsertingRegistrationPeriod={isUpsertingRegistrationPeriod}
              handleChangeRegistrationPeriodStatus={handleChangeRegistrationPeriodStatus}
              isSelectedYearOpen={isSelectedYearOpen}
              registrationMilitaries={registrationMilitaries}
              canRegisterSizes={canRegisterSizes}
              handleOpenRegistrationDialog={handleOpenRegistrationDialog}
              registrationCurrentPage={registrationCurrentPage}
              registrationTotalPages={registrationTotalPages}
              registrationTotal={registrationTotal}
              onPageChange={setPage}
            />
          </TabsContent>

          <TabsContent value="increase-list" className="mt-4">
            <IncreaseListTab
              selectedYear={selectedYear}
              isFetching={isFetching}
              isLoading={isLoading}
              isFetchingIncomingTransferRequests={isFetchingIncomingTransferRequests}
              isLoadingIncomingTransferRequests={isLoadingIncomingTransferRequests}
              increaseQuickFilter={increaseQuickFilter}
              setIncreaseQuickFilter={setIncreaseQuickFilter}
              filteredIncreaseRows={filteredIncreaseRows}
              canManageTransfer={canManageTransfer}
              onAcceptTransferRequest={handleAcceptTransferRequest}
              isAcceptingTransferRequest={isAcceptingTransferRequest}
              externalIncreaseForm={externalIncreaseForm}
              onExternalIncreaseFieldChange={handleExternalIncreaseFieldChange}
              onSubmitExternalIncrease={handleSubmitExternalIncrease}
              isSubmittingExternalIncrease={isSubmittingExternalIncrease}
              currentAdminUnitName={currentAdminUnitName}
              assignedUnits={assignedUnits}
              militaryTypes={militaryTypes}
            />
          </TabsContent>

          <TabsContent value="decrease-list" className="mt-4">
            <MilitaryChangeTable
              title={`Quân nhân giảm trong năm ${selectedYear}`}
              rows={outgoingMilitariesByYear}
              yearField="unitTransferOutYear"
              emptyMessage={`Không có quân nhân giảm trong năm ${selectedYear}.`}
            />
          </TabsContent>

          <TabsContent value="assigned-unit-list" className="mt-4">
            <AssignedUnitManagementTab
              canManageAssignedUnits={canAccess}
              selectedScopeUnitId={selectedScopeUnitId}
              selectedScopeUnitName={selectedScopeUnitName}
              isSuperAdmin={isSuperAdmin}
              isLoading={isLoadingAssignedUnits}
              isFetching={isFetchingAssignedUnits}
              error={assignedUnitsError}
              assignedUnits={assignedUnits}
              onCreateAssignedUnit={handleCreateAssignedUnit}
              isCreatingAssignedUnit={isCreatingAssignedUnit}
              onUpdateAssignedUnit={handleUpdateAssignedUnit}
              isUpdatingAssignedUnit={isUpdatingAssignedUnit}
              onDeleteAssignedUnit={handleDeleteAssignedUnit}
              isDeletingAssignedUnit={isDeletingAssignedUnit}
            />
          </TabsContent>
        </Tabs>
      </div>

      <MilitaryImportDialog
        open={openMilitaryImportDialog}
        onOpenChange={(open) => {
          setOpenMilitaryImportDialog(open);
          if (!open) {
            setMilitaryImportReport(null);
          } else if (selectedType) {
            setMilitaryImportType(selectedType);
          }
        }}
        onDownloadTemplate={handleDownloadTemplate}
        isDownloadingTemplate={isDownloadingTemplate}
        selectedType={militaryImportType}
        onChangeSelectedType={setMilitaryImportType}
        militaryTypes={militaryTypes}
        onFileChange={(file) => {
          setImportFile(file);
          setMilitaryImportReport(null);
        }}
        onCancel={() => {
          setOpenMilitaryImportDialog(false);
          setMilitaryImportReport(null);
        }}
        onImport={handleImport}
        isImporting={isImporting}
        importReport={militaryImportReport}
      />

      <RegistrationImportDialog
        open={openRegistrationImportDialog}
        onOpenChange={(open) => setOpenRegistrationImportDialog(open)}
        selectedYear={selectedYear}
        registrationTemplateIncludeExisting={registrationTemplateIncludeExisting}
        onChangeRegistrationTemplateIncludeExisting={setRegistrationTemplateIncludeExisting}
        registrationImportKeepExisting={registrationImportKeepExisting}
        onChangeRegistrationImportKeepExisting={setRegistrationImportKeepExisting}
        registrationCategories={registrationCategories}
        selectedRegistrationCategoryIds={selectedRegistrationCategoryIds}
        setSelectedRegistrationCategoryIds={setSelectedRegistrationCategoryIds}
        isLoadingRegistrationOptions={isLoadingRegistrationOptions}
        isFetchingRegistrationOptions={isFetchingRegistrationOptions}
        onToggleRegistrationCategory={handleToggleRegistrationCategory}
        onDownloadRegistrationTemplate={handleDownloadRegistrationTemplate}
        isDownloadingRegistrationTemplate={isDownloadingRegistrationTemplate}
        onRegistrationFileChange={(file) => {
          setRegistrationImportFile(file);
          setRegistrationImportPreview(null);
        }}
        onPreviewRegistrationImport={handlePreviewRegistrationImport}
        isPreviewingRegistrationImport={isPreviewingRegistrationImport}
        onImportRegistrations={handleImportRegistrations}
        isImportingRegistrations={isImportingRegistrations}
        registrationImportPreview={registrationImportPreview}
        onClose={() => setOpenRegistrationImportDialog(false)}
      />

      <MilitarySizeRegistrationDialog
        key={`${selectedMilitary?.id || "none"}:${selectedYear}:${openRegistrationDialog ? "open" : "closed"}`}
        open={openRegistrationDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseRegistrationDialog();
            return;
          }
          setOpenRegistrationDialog(true);
        }}
        military={selectedMilitary}
        categories={registrationOptionsData?.categories || []}
        registrations={selectedMilitaryRegistrationsData?.registrations || []}
        isLoadingOptions={isLoadingRegistrationOptions || isFetchingRegistrationOptions}
        isLoadingRegistrations={
          isLoadingSelectedMilitaryRegistrations || isFetchingSelectedMilitaryRegistrations
        }
        isSaving={isSavingRegistrations}
        year={selectedYear}
        onSubmit={handleSaveRegistrations}
      />

      <CutTransferDialog
        open={openCutTransferDialog}
        onOpenChange={(open) => {
          if (!open) {
            setOpenCutTransferDialog(false);
            setCutTransferMilitary(null);
            setCutTransferTypeId("");
            return;
          }
          setOpenCutTransferDialog(true);
        }}
        cutTransferMilitary={cutTransferMilitary}
        cutTransferTypeId={cutTransferTypeId}
        setCutTransferTypeId={setCutTransferTypeId}
        cutTransferTypeOptions={cutTransferTypeOptions}
        cutTransferTargetUnitId={cutTransferTargetUnitId}
        setCutTransferTargetUnitId={setCutTransferTargetUnitId}
        transferTargetUnits={transferTargetUnits}
        cutTransferYear={cutTransferYear}
        setCutTransferYear={setCutTransferYear}
        cutTransferNote={cutTransferNote}
        setCutTransferNote={setCutTransferNote}
        onCancel={() => {
          setOpenCutTransferDialog(false);
          setCutTransferMilitary(null);
          setCutTransferTypeId("");
        }}
        onSubmit={handleSubmitCutTransferRequest}
        isCreatingCutTransferRequest={isCreatingCutTransferRequest}
      />
    </>
  );
}
