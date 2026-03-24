import { useDeferredValue, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateAllocationModeMutation,
  useDeleteAllocationModeMutation,
  useGetAllocationModesQuery,
  useGetAllocationServiceLifeEditorQuery,
  useUpdateAllocationModeMutation,
} from "@/features/inventory/inventoryApi";
import {
  useGetMilitariesQuery,
  useGetMilitaryUnitsQuery,
} from "@/features/military/militaryApi";
import { useAuthorization } from "@/features/auth/useAuthorization";
import { getApiErrorMessage } from "@/utils/apiError";

const RULE_FIELD_OPTIONS = [
  { value: "initialCommissioningYear", label: "Năm phong/nhập ngũ ban đầu" },
  { value: "gender", label: "Giới tính" },
  { value: "rank", label: "Cấp bậc" },
  { value: "rankGroup", label: "Nhóm cấp bậc" },
  { value: "position", label: "Chức vụ" },
  { value: "assignedUnitId", label: "Đơn vị quản lý" },
  { value: "assignedUnit", label: "Đơn vị gắn" },
  { value: "militaryCode", label: "Số quân nhân" },
  { value: "unitId", label: "Đơn vị gốc" },
];

const RULE_OPERATOR_OPTIONS = [
  { value: "EQ", label: "=" },
  { value: "NEQ", label: "!=" },
  { value: "GT", label: ">" },
  { value: "GTE", label: ">=" },
  { value: "LT", label: "<" },
  { value: "LTE", label: "<=" },
  { value: "IN", label: "Thuộc danh sách" },
  { value: "NOT_IN", label: "Không thuộc danh sách" },
  { value: "CONTAINS", label: "Chứa" },
  { value: "STARTS_WITH", label: "Bắt đầu bằng" },
  { value: "ENDS_WITH", label: "Kết thúc bằng" },
  { value: "IS_TRUE", label: "Là đúng" },
  { value: "IS_FALSE", label: "Là sai" },
];

const RULE_VALUE_SOURCE_OPTIONS = [
  { value: "STATIC", label: "Giá trị cố định" },
  { value: "ISSUE_YEAR", label: "Năm cấp phát" },
  { value: "CURRENT_YEAR", label: "Năm hiện tại" },
];

const RULE_COMBINATOR_OPTIONS = [
  { value: "ALL", label: "Tất cả điều kiện" },
  { value: "ANY", label: "Bất kỳ điều kiện nào" },
];

const NUMERIC_RULE_FIELDS = new Set([
  "initialCommissioningYear",
  "assignedUnitId",
  "unitId",
]);

function createEmptyRule() {
  return {
    field: "initialCommissioningYear",
    operator: "EQ",
    valueSource: "ISSUE_YEAR",
    value: "",
  };
}

function createEmptyDraft(defaultScope, defaultUnitId) {
  return {
    scope: defaultScope,
    unitId: defaultScope === "UNIT" ? defaultUnitId : "",
    code: "",
    name: "",
    description: "",
    isActive: true,
    typeId: "",
    ruleCombinator: "ALL",
    rules: [],
    includedMilitaryIds: [],
    excludedMilitaryIds: [],
    quantitiesByCategoryId: {},
  };
}

function parseRuleValue(field, operator, rawValue) {
  if (operator === "IS_TRUE" || operator === "IS_FALSE") return undefined;
  if (rawValue === undefined || rawValue === null) return undefined;
  const trimmed = String(rawValue).trim();
  if (!trimmed) return undefined;

  if (operator === "IN" || operator === "NOT_IN") {
    const values = trimmed
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (NUMERIC_RULE_FIELDS.has(field)) {
      return values.map((value) => Number(value)).filter(Number.isFinite);
    }
    return values;
  }

  if (NUMERIC_RULE_FIELDS.has(field)) {
    const numericValue = Number(trimmed);
    if (Number.isFinite(numericValue)) return numericValue;
  }

  return trimmed;
}

function toDraft(mode, defaultUnitId) {
  return {
    scope: mode.scope || "UNIT",
    unitId: mode.scope === "UNIT" ? String(mode.unit?.id || defaultUnitId || "") : "",
    code: mode.code || "",
    name: mode.name || "",
    description: mode.description || "",
    isActive: mode.isActive !== false,
    typeId: String(mode.type?.id || mode.militaryTypes?.[0]?.id || ""),
    ruleCombinator: mode.ruleCombinator || "ALL",
    rules: Array.isArray(mode.ruleConfig?.clauses)
      ? mode.ruleConfig.clauses.map((rule) => ({
          field: rule.field || "initialCommissioningYear",
          operator: rule.operator || "EQ",
          valueSource: rule.valueSource || "STATIC",
          value:
            rule.value === undefined || rule.value === null
              ? ""
              : Array.isArray(rule.value)
                ? rule.value.join(", ")
                : String(rule.value),
        }))
      : [],
    includedMilitaryIds: (mode.includedMilitaries || []).map((military) => military.id),
    excludedMilitaryIds: (mode.excludedMilitaries || []).map((military) => military.id),
    quantitiesByCategoryId: Object.fromEntries(
      (mode.categories || []).map((row) => [
        Number(row.category?.id || 0),
        String(row.quantity ?? 0),
      ]),
    ),
  };
}

function buildPayload(draft, isSuperAdmin, serviceLifeRows) {
  return {
    scope: draft.scope,
    ...(draft.scope === "UNIT" && (isSuperAdmin || draft.unitId)
      ? { unitId: Number(draft.unitId) }
      : {}),
    ...(draft.code.trim() ? { code: draft.code.trim() } : {}),
    name: draft.name.trim(),
    ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
    isActive: Boolean(draft.isActive),
    militaryTypeIds: [Number(draft.typeId)],
    ruleCombinator: draft.ruleCombinator || "ALL",
    ...(draft.rules.length
      ? {
          ruleConfig: {
            clauses: draft.rules
              .map((rule) => ({
                field: rule.field,
                operator: rule.operator,
                valueSource: rule.valueSource,
                value: parseRuleValue(rule.field, rule.operator, rule.value),
              }))
              .map((rule) =>
                rule.valueSource === "STATIC" && rule.value !== undefined
                  ? rule
                  : {
                      field: rule.field,
                      operator: rule.operator,
                      valueSource: rule.valueSource,
                    },
              ),
          },
        }
      : {}),
    includedMilitaryIds: [...new Set(draft.includedMilitaryIds)],
    excludedMilitaryIds: [...new Set(draft.excludedMilitaryIds)].filter(
      (id) => !draft.includedMilitaryIds.includes(id),
    ),
    categories: serviceLifeRows.map((row, index) => ({
      categoryId: Number(row.category.id),
      quantity: Math.max(
        0,
        Number.parseInt(draft.quantitiesByCategoryId[row.category.id] || "0", 10) || 0,
      ),
      isActive: true,
      sortOrder: index,
    })),
  };
}

function ScopeBadge({ scope }) {
  return (
    <Badge variant={scope === "SYSTEM" ? "default" : "secondary"}>
      {scope === "SYSTEM" ? "Hệ thống" : "Đơn vị"}
    </Badge>
  );
}

function ModeSummary({ mode }) {
  const totalQuantity = (mode.categories || []).reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0,
  );

  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <div>
        {mode.type?.name || mode.type?.code || "Chưa chọn loại quân nhân"}
      </div>
      <div className="mt-1">
        {(mode.categories || []).length} quân trang, tổng số lượng {totalQuantity}
      </div>
    </div>
  );
}

export default function AllocationModesTab({
  militaryTypes = [],
}) {
  const { isSuperAdmin, hasRole, user } = useAuthorization();
  const canManageModes = isSuperAdmin || hasRole(["ADMIN"]);
  const actorUnitId = user?.unitId ? String(user.unitId) : "";
  const [scopeFilter, setScopeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const [militarySearch, setMilitarySearch] = useState("");
  const deferredMilitarySearch = useDeferredValue(militarySearch);
  const [draft, setDraft] = useState(() =>
    createEmptyDraft(isSuperAdmin ? "SYSTEM" : "UNIT", actorUnitId),
  );

  const { data: allocationModesData, isLoading: isLoadingModes } =
    useGetAllocationModesQuery(
      canManageModes
        ? { scope: scopeFilter, status: "all" }
        : undefined,
      { skip: !canManageModes },
    );
  const { data: militaryUnitsData } = useGetMilitaryUnitsQuery(
    isSuperAdmin ? "all" : "default",
    { skip: !canManageModes },
  );
  const { data: militariesData, isFetching: isFetchingMilitaries } =
    useGetMilitariesQuery(
      {
        search: deferredMilitarySearch || undefined,
        limit: 50,
      },
      { skip: !canManageModes },
    );

  const previewUnitId =
    draft.scope === "UNIT" ? draft.unitId || actorUnitId : actorUnitId;

  const { data: serviceLifeEditorData, isFetching: isFetchingServiceLife } =
    useGetAllocationServiceLifeEditorQuery(
      {
        typeId: draft.typeId || undefined,
        unitId: previewUnitId || undefined,
      },
      {
        skip: !canManageModes || !draft.typeId || !previewUnitId,
      },
    );

  const [createAllocationMode, { isLoading: isCreating }] =
    useCreateAllocationModeMutation();
  const [updateAllocationMode, { isLoading: isUpdating }] =
    useUpdateAllocationModeMutation();
  const [deleteAllocationMode, { isLoading: isDeleting }] =
    useDeleteAllocationModeMutation();

  const modes = allocationModesData?.modes || [];
  const units = militaryUnitsData?.units || [];
  const militaries = militariesData?.militaries || [];

  const serviceLifeRows = useMemo(
    () =>
      [...(serviceLifeEditorData?.selectedRules || [])].sort((left, right) =>
        String(left.category?.name || "").localeCompare(
          String(right.category?.name || ""),
          "vi",
        ),
      ),
    [serviceLifeEditorData],
  );

  const resetDraft = () => {
    setDraft(createEmptyDraft(isSuperAdmin ? "SYSTEM" : "UNIT", actorUnitId));
    setEditingMode(null);
    setMilitarySearch("");
  };

  const openCreateDialog = () => {
    resetDraft();
    setDialogOpen(true);
  };

  const openEditDialog = (mode) => {
    setEditingMode(mode);
    setDraft(toDraft(mode, actorUnitId));
    setMilitarySearch("");
    setDialogOpen(true);
  };

  const closeDialog = (nextOpen) => {
    setDialogOpen(nextOpen);
    if (!nextOpen) resetDraft();
  };

  const updateDraft = (patch) => {
    setDraft((current) => ({
      ...current,
      ...patch,
    }));
  };

  const setQuantity = (categoryId, quantity) => {
    setDraft((current) => ({
      ...current,
      quantitiesByCategoryId: {
        ...current.quantitiesByCategoryId,
        [categoryId]: quantity,
      },
    }));
  };

  const addRule = () => {
    setDraft((current) => ({
      ...current,
      rules: [...current.rules, createEmptyRule()],
    }));
  };

  const updateRule = (ruleIndex, patch) => {
    setDraft((current) => ({
      ...current,
      rules: current.rules.map((rule, index) =>
        index === ruleIndex ? { ...rule, ...patch } : rule,
      ),
    }));
  };

  const removeRule = (ruleIndex) => {
    setDraft((current) => ({
      ...current,
      rules: current.rules.filter((_, index) => index !== ruleIndex),
    }));
  };

  const setMilitaryMode = (militaryId, mode) => {
    setDraft((current) => {
      const includedMilitaryIds = current.includedMilitaryIds.filter((id) => id !== militaryId);
      const excludedMilitaryIds = current.excludedMilitaryIds.filter((id) => id !== militaryId);

      if (mode === "include") {
        return {
          ...current,
          includedMilitaryIds: [...includedMilitaryIds, militaryId],
          excludedMilitaryIds,
        };
      }

      if (mode === "exclude") {
        return {
          ...current,
          includedMilitaryIds,
          excludedMilitaryIds: [...excludedMilitaryIds, militaryId],
        };
      }

      return {
        ...current,
        includedMilitaryIds,
        excludedMilitaryIds,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!draft.name.trim()) {
      toast.error("Vui lòng nhập tên chế độ cấp phát.");
      return;
    }

    if (!draft.typeId) {
      toast.error("Vui lòng chọn loại quân nhân.");
      return;
    }

    if (!serviceLifeRows.length) {
      toast.error(
        "Loại quân nhân này chưa có cấu hình niên hạn quân trang để lập chế độ cấp phát.",
      );
      return;
    }

    const hasInvalidQuantity = serviceLifeRows.some((row) => {
      const categoryId = Number(row.category?.id || 0);
      const value = Number.parseInt(draft.quantitiesByCategoryId[categoryId] || "0", 10);
      return !Number.isInteger(value) || value < 0;
    });

    if (hasInvalidQuantity) {
      toast.error("Số lượng của tất cả quân trang phải là số nguyên không âm.");
      return;
    }

    try {
      const payload = buildPayload(draft, isSuperAdmin, serviceLifeRows);

      if (editingMode?.id) {
        await updateAllocationMode({
          modeId: editingMode.id,
          ...payload,
        }).unwrap();
        toast.success("Đã cập nhật chế độ cấp phát.");
      } else {
        await createAllocationMode(payload).unwrap();
        toast.success("Đã tạo chế độ cấp phát.");
      }

      closeDialog(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể lưu chế độ cấp phát."),
      );
    }
  };

  const handleDelete = async (mode) => {
    if (!window.confirm(`Xóa chế độ "${mode.name}"?`)) return;
    try {
      await deleteAllocationMode({ modeId: mode.id }).unwrap();
      toast.success("Đã xóa chế độ cấp phát.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể xóa chế độ cấp phát."),
      );
    }
  };

  if (!canManageModes) {
    return (
      <Card className="rounded-2xl border-dashed p-5 text-sm text-muted-foreground">
        Bạn cần quyền quản trị đơn vị hoặc quản trị hệ thống để quản lý chế độ cấp phát.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 text-primary"
            >
              Chế độ cấp phát v2
            </Badge>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold sm:text-xl">
                Chế độ cấp phát theo loại quân nhân
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Mỗi chế độ chỉ áp dụng cho một loại quân nhân. Danh sách quân trang
                được lấy tự động từ cấu hình niên hạn quân trang của loại đó, bạn
                chỉ cần nhập số lượng cấp phát cho từng quân trang.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
              className="h-10 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="system">Hệ thống</option>
              <option value="unit">Đơn vị</option>
            </select>
            <Button onClick={openCreateDialog} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Tạo chế độ
            </Button>
          </div>
        </div>
      </Card>

      {isLoadingModes ? (
        <Card className="p-4 text-sm text-muted-foreground">
          Đang tải chế độ cấp phát...
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {modes.map((mode) => (
            <Card key={mode.id} className="rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <ScopeBadge scope={mode.scope} />
                    {!mode.isActive && <Badge variant="outline">Tạm dừng</Badge>}
                    {mode.unit?.name ? (
                      <Badge variant="outline">{mode.unit.name}</Badge>
                    ) : null}
                    {mode.type?.name ? (
                      <Badge variant="outline">
                        {[mode.type.code, mode.type.name].filter(Boolean).join(" - ")}
                      </Badge>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-semibold">{mode.name}</h3>
                    {mode.code ? (
                      <div className="text-xs text-muted-foreground">
                        Mã: {mode.code}
                      </div>
                    ) : null}
                  </div>
                  {mode.description ? (
                    <p className="text-sm text-muted-foreground">
                      {mode.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(mode)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(mode)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <ModeSummary mode={mode} />
                {(mode.categories || []).length ? (
                  <div className="flex flex-wrap gap-2">
                    {mode.categories.slice(0, 6).map((row) => (
                      <Badge key={row.id} variant="secondary">
                        {row.category?.name || "Không rõ"} x{row.quantity}
                      </Badge>
                    ))}
                    {mode.categories.length > 6 ? (
                      <Badge variant="outline">+{mode.categories.length - 6}</Badge>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Chưa có quân trang nào.
                  </div>
                )}
              </div>
            </Card>
          ))}

          {!modes.length ? (
            <Card className="rounded-2xl border-dashed p-5 text-sm text-muted-foreground xl:col-span-2">
              Chưa có chế độ cấp phát nào.
            </Card>
          ) : null}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editingMode ? "Cập nhật chế độ cấp phát" : "Tạo chế độ cấp phát"}
            </DialogTitle>
            <DialogDescription>
              Chọn một loại quân nhân, hệ thống sẽ tự lấy toàn bộ quân trang từ
              cấu hình niên hạn tương ứng để bạn nhập số lượng cấp phát.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5 xl:col-span-1">
                <label className="text-sm font-medium">Phạm vi</label>
                <select
                  value={draft.scope}
                  onChange={(event) =>
                    updateDraft({
                      scope: event.target.value,
                      unitId:
                        event.target.value === "UNIT"
                          ? draft.unitId || actorUnitId
                          : "",
                    })
                  }
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  disabled={!isSuperAdmin}
                >
                  <option value="UNIT">Đơn vị</option>
                  <option value="SYSTEM">Hệ thống</option>
                </select>
              </div>

              <div className="space-y-1.5 xl:col-span-1">
                <label className="text-sm font-medium">Đơn vị</label>
                <select
                  value={draft.scope === "UNIT" ? draft.unitId : ""}
                  onChange={(event) => updateDraft({ unitId: event.target.value })}
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  disabled={draft.scope !== "UNIT" || !isSuperAdmin}
                >
                  <option value="">Chọn đơn vị</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={String(unit.id)}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 xl:col-span-1">
                <label className="text-sm font-medium">Loại quân nhân</label>
                <select
                  value={draft.typeId}
                  onChange={(event) =>
                    updateDraft({
                      typeId: event.target.value,
                      quantitiesByCategoryId: {},
                    })
                  }
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                >
                  <option value="">Chọn loại quân nhân</option>
                  {militaryTypes.map((type) => (
                    <option key={type.id} value={String(type.id)}>
                      {[type.code, type.name].filter(Boolean).join(" - ")}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm xl:col-span-1 xl:self-end">
                <Checkbox
                  checked={draft.isActive}
                  onCheckedChange={(checked) =>
                    updateDraft({ isActive: checked === true })
                  }
                />
                Đang kích hoạt
              </label>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tên chế độ</label>
                <Input
                  value={draft.name}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                  placeholder="Nhập tên chế độ cấp phát"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mã chế độ</label>
                <Input
                  value={draft.code}
                  onChange={(event) => updateDraft({ code: event.target.value })}
                  placeholder="VD: SQ-LAN-DAU"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={draft.description}
                onChange={(event) =>
                  updateDraft({ description: event.target.value })
                }
                placeholder="Mô tả phạm vi, đối tượng và ghi chú nghiệp vụ"
                className="min-h-24"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-semibold">Quân trang theo niên hạn</h3>
                  <p className="text-sm text-muted-foreground">
                    Danh sách này được lấy từ cấu hình niên hạn của loại quân nhân đã chọn.
                  </p>
                </div>
                <Badge variant="outline">
                  {serviceLifeRows.length} quân trang
                </Badge>
              </div>

              {!draft.typeId ? (
                <Card className="rounded-2xl border-dashed p-4 text-sm text-muted-foreground">
                  Chọn loại quân nhân để tải danh sách quân trang theo niên hạn.
                </Card>
              ) : isFetchingServiceLife ? (
                <Card className="rounded-2xl p-4 text-sm text-muted-foreground">
                  Đang tải cấu hình niên hạn quân trang...
                </Card>
              ) : serviceLifeRows.length ? (
                <div className="space-y-3">
                  {serviceLifeRows.map((row) => {
                    const categoryId = Number(row.category?.id || 0);
                    const quantityValue =
                      draft.quantitiesByCategoryId[categoryId] ?? "0";

                    return (
                      <Card
                        key={categoryId}
                        className="rounded-2xl border border-border/70 p-4 shadow-sm"
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-medium">{row.category?.name}</h4>
                              {row.category?.code ? (
                                <Badge variant="outline">{row.category.code}</Badge>
                              ) : null}
                              {row.category?.unitOfMeasure?.name ? (
                                <Badge variant="secondary">
                                  {row.category.unitOfMeasure.name}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>Niên hạn: {row.serviceLifeYears} năm</span>
                              <span>Giới tính: {row.genderDisplay}</span>
                              <span>Cấp bậc: {row.rankGroupDisplay}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Số lượng cấp phát</label>
                            <Input
                              type="number"
                              min={0}
                              value={quantityValue}
                              onChange={(event) =>
                                setQuantity(categoryId, event.target.value)
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="rounded-2xl border-dashed p-4 text-sm text-muted-foreground">
                  Loại quân nhân này chưa có quân trang nào trong phần niên hạn.
                </Card>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Quy tắc đặc biệt</h3>
                  <p className="text-sm text-muted-foreground">
                    Điều kiện này áp dụng chung cho toàn bộ quân trang trong chế độ.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm quy tắc
                </Button>
              </div>

              <div className="space-y-3 rounded-xl border border-border/70 p-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Cách ghép quy tắc</label>
                    <select
                      value={draft.ruleCombinator}
                      onChange={(event) =>
                        updateDraft({ ruleCombinator: event.target.value })
                      }
                      className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                    >
                      {RULE_COMBINATOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {draft.rules.length ? (
                  draft.rules.map((rule, ruleIndex) => (
                    <div
                      key={`rule-${ruleIndex}`}
                      className="grid gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 xl:grid-cols-[1.2fr_0.9fr_1fr_1fr_auto]"
                    >
                      <select
                        value={rule.field}
                        onChange={(event) =>
                          updateRule(ruleIndex, { field: event.target.value })
                        }
                        className="h-10 rounded-xl border bg-background px-3 text-sm"
                      >
                        {RULE_FIELD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={rule.operator}
                        onChange={(event) =>
                          updateRule(ruleIndex, { operator: event.target.value })
                        }
                        className="h-10 rounded-xl border bg-background px-3 text-sm"
                      >
                        {RULE_OPERATOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={rule.valueSource}
                        onChange={(event) =>
                          updateRule(ruleIndex, {
                            valueSource: event.target.value,
                            value:
                              event.target.value === "STATIC"
                                ? rule.value
                                : "",
                          })
                        }
                        className="h-10 rounded-xl border bg-background px-3 text-sm"
                      >
                        {RULE_VALUE_SOURCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <Input
                        value={rule.value}
                        onChange={(event) =>
                          updateRule(ruleIndex, { value: event.target.value })
                        }
                        placeholder={
                          rule.operator === "IN" || rule.operator === "NOT_IN"
                            ? "VD: 2020, 2021"
                            : "Giá trị"
                        }
                        disabled={
                          rule.valueSource !== "STATIC" ||
                          rule.operator === "IS_TRUE" ||
                          rule.operator === "IS_FALSE"
                        }
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(ruleIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Chưa có quy tắc đặc biệt.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="font-semibold">Quân nhân chỉ định</h3>
                  <p className="text-sm text-muted-foreground">
                    Có thể bỏ qua nếu chế độ áp dụng theo quy tắc chung.
                  </p>
                </div>
                <div className="w-full lg:w-72">
                  <label className="mb-1 block text-sm font-medium">Tìm quân nhân</label>
                  <Input
                    value={militarySearch}
                    onChange={(event) => setMilitarySearch(event.target.value)}
                    placeholder="Nhập tên hoặc số quân nhân"
                  />
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
                <div className="rounded-xl border border-border/70 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Danh sách quân nhân</span>
                    <span className="text-xs text-muted-foreground">
                      {isFetchingMilitaries ? "Đang tải..." : `${militaries.length} kết quả`}
                    </span>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-auto pr-1">
                    {militaries.map((military) => {
                      const isIncluded = draft.includedMilitaryIds.includes(military.id);
                      const isExcluded = draft.excludedMilitaryIds.includes(military.id);

                      return (
                        <div
                          key={military.id}
                          className="rounded-lg border border-border/70 p-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {military.fullname}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {military.militaryCode || "Không có mã"}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={isIncluded ? "default" : "outline"}
                                onClick={() =>
                                  setMilitaryMode(
                                    military.id,
                                    isIncluded ? "clear" : "include",
                                  )
                                }
                              >
                                Bao gồm
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={isExcluded ? "destructive" : "outline"}
                                onClick={() =>
                                  setMilitaryMode(
                                    military.id,
                                    isExcluded ? "clear" : "exclude",
                                  )
                                }
                              >
                                Loại trừ
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!militaries.length ? (
                      <div className="text-sm text-muted-foreground">
                        Không tìm thấy quân nhân nào.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="text-sm font-medium text-emerald-700">
                      Bao gồm riêng
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {draft.includedMilitaryIds.length ? (
                        draft.includedMilitaryIds.map((militaryId) => {
                          const military = militaries.find((item) => item.id === militaryId);
                          return (
                            <Badge key={militaryId} variant="secondary">
                              {military?.fullname || militaryId}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Chưa chọn quân nhân nào.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                    <div className="text-sm font-medium text-rose-700">
                      Loại trừ riêng
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {draft.excludedMilitaryIds.length ? (
                        draft.excludedMilitaryIds.map((militaryId) => {
                          const military = militaries.find((item) => item.id === militaryId);
                          return (
                            <Badge key={militaryId} variant="secondary">
                              {military?.fullname || militaryId}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Chưa loại trừ quân nhân nào.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => closeDialog(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Đang lưu..." : "Lưu chế độ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
