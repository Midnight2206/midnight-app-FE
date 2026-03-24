import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useGetAllocationServiceLifeEditorQuery,
  useSaveAllocationServiceLifeEditorMutation,
} from "@/features/inventory/inventoryApi";
import { getApiErrorMessage } from "@/utils/apiError";
import { DISPLAY_LABELS } from "@/utils/constants";

const DEFAULT_DRAFT = {
  serviceLifeYears: "1",
  rankGroup: "ANY",
  gender: "ANY",
};

const RANK_GROUP_OPTIONS = [
  { value: "ANY", label: "Không giới hạn cấp bậc" },
  { value: "CAP_UY", label: "Chỉ cấp uý" },
  { value: "CAP_TA", label: "Chỉ cấp tá" },
  { value: "CAP_TUONG", label: "Chỉ cấp tướng" },
  { value: "HSQ_BS", label: "Chỉ HSQ-BS" },
];

const GENDER_OPTIONS = [
  { value: "ANY", label: "Không giới hạn giới tính" },
  { value: "MALE", label: "Chỉ nam" },
  { value: "FEMALE", label: "Chỉ nữ" },
];

function formatTypeLabel(type) {
  if (!type) return "-";
  return [type.code, type.name].filter(Boolean).join(" - ") || "-";
}

function StatPill({ label, value, tone = "default" }) {
  const toneClass =
    tone === "accent"
      ? "border-primary/20 bg-primary/5 text-primary"
      : "border-border/70 bg-muted/60 text-foreground";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold leading-none">{value}</div>
    </div>
  );
}

function normalizeDraft(rule) {
  return {
    serviceLifeYears: String(rule?.serviceLifeYears || 1),
    rankGroup: String(rule?.rankGroup || "ANY"),
    gender: String(rule?.gender || "ANY"),
  };
}

export default function ServiceLifeEditorTab({
  militaryTypes = [],
  categories = [],
}) {
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [mobilePanel, setMobilePanel] = useState("catalog");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [draftsByCategoryId, setDraftsByCategoryId] = useState({});

  useEffect(() => {
    if (selectedTypeId) return;
    if (!militaryTypes.length) return;
    setSelectedTypeId(String(militaryTypes[0].id));
  }, [militaryTypes, selectedTypeId]);

  const {
    data: editorData,
    isLoading,
    isFetching,
  } = useGetAllocationServiceLifeEditorQuery(
    { typeId: selectedTypeId },
    {
      skip: !selectedTypeId,
      refetchOnMountOrArgChange: true,
    },
  );

  const [saveAllocationServiceLifeEditor, { isLoading: isSaving }] =
    useSaveAllocationServiceLifeEditorMutation();

  useEffect(() => {
    if (!editorData) return;
    const nextSelectedIds = (editorData.selectedRules || []).map((rule) =>
      Number(rule.category?.id),
    );
    const nextDrafts = {};
    (editorData.selectedRules || []).forEach((rule) => {
      const categoryId = Number(rule.category?.id || 0);
      if (!categoryId) return;
      nextDrafts[categoryId] = normalizeDraft(rule);
    });
    setSelectedCategoryIds(nextSelectedIds);
    setDraftsByCategoryId(nextDrafts);
  }, [editorData]);

  const selectedCategoryIdSet = useMemo(
    () => new Set(selectedCategoryIds.map((id) => Number(id))),
    [selectedCategoryIds],
  );

  const availableCategories = useMemo(() => {
    const serverCategories = editorData?.availableCategories?.length
      ? editorData.availableCategories
      : categories.map((category) => ({
          id: category.id,
          name: category.name,
          code: category.code || null,
          unitOfMeasure: category.unitOfMeasure || null,
          selected: false,
        }));

    const normalizedSearch = categorySearch.trim().toLowerCase();
    return serverCategories
      .filter((category) => {
        if (!normalizedSearch) return true;
        const haystack = [
          category.name,
          category.code,
          category.unitOfMeasure?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((left, right) => {
        const leftSelected = selectedCategoryIdSet.has(Number(left.id)) ? 1 : 0;
        const rightSelected = selectedCategoryIdSet.has(Number(right.id))
          ? 1
          : 0;
        if (leftSelected !== rightSelected) return rightSelected - leftSelected;
        return left.name.localeCompare(right.name, "vi");
      });
  }, [categorySearch, categories, editorData, selectedCategoryIdSet]);

  const selectedRows = useMemo(() => {
    const byId = new Map(
      availableCategories.map((category) => [Number(category.id), category]),
    );
    const fallbackById = new Map(
      categories.map((category) => [Number(category.id), category]),
    );
    return selectedCategoryIds
      .map((categoryId) => {
        const category =
          byId.get(Number(categoryId)) || fallbackById.get(Number(categoryId));
        if (!category) return null;
        return {
          id: Number(category.id),
          name: category.name,
          code: category.code || null,
          unitOfMeasure: category.unitOfMeasure || null,
          ...normalizeDraft(draftsByCategoryId[category.id] || DEFAULT_DRAFT),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.name.localeCompare(right.name, "vi"));
  }, [
    availableCategories,
    categories,
    draftsByCategoryId,
    selectedCategoryIds,
  ]);

  const toggleCategory = (categoryId) => {
    const numericCategoryId = Number(categoryId);
    if (!numericCategoryId) return;
    setSelectedCategoryIds((prev) => {
      if (prev.includes(numericCategoryId)) {
        const next = prev.filter((id) => id !== numericCategoryId);
        setDraftsByCategoryId((drafts) => {
          const nextDrafts = { ...drafts };
          delete nextDrafts[numericCategoryId];
          return nextDrafts;
        });
        return next;
      }
      setDraftsByCategoryId((drafts) => ({
        ...drafts,
        [numericCategoryId]: drafts[numericCategoryId] || { ...DEFAULT_DRAFT },
      }));
      return [...prev, numericCategoryId];
    });
  };

  const setDraftField = (categoryId, field, value) => {
    setDraftsByCategoryId((prev) => ({
      ...prev,
      [categoryId]: {
        ...normalizeDraft(prev[categoryId] || DEFAULT_DRAFT),
        [field]: value,
      },
    }));
  };

  const handleSelectVisible = () => {
    const visibleIds = availableCategories.map((category) =>
      Number(category.id),
    );
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
    setDraftsByCategoryId((prev) => {
      const next = { ...prev };
      visibleIds.forEach((id) => {
        next[id] = normalizeDraft(next[id] || DEFAULT_DRAFT);
      });
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedCategoryIds([]);
    setDraftsByCategoryId({});
    setMobilePanel("catalog");
  };

  const handleSave = async () => {
    if (!selectedTypeId) {
      toast.error("Vui lòng chọn loại quân nhân.");
      return;
    }

    const assignments = selectedRows.map((row) => ({
      categoryId: row.id,
      serviceLifeYears: Number.parseInt(row.serviceLifeYears, 10),
      rankGroup: row.rankGroup,
      gender: row.gender,
    }));

    const invalidRow = assignments.find(
      (entry) =>
        !Number.isInteger(entry.serviceLifeYears) ||
        entry.serviceLifeYears <= 0 ||
        entry.serviceLifeYears > 100,
    );
    if (invalidRow) {
      toast.error(
        "Niên hạn của tất cả quân trang phải là số nguyên từ 1 đến 100 năm.",
      );
      return;
    }

    try {
      await saveAllocationServiceLifeEditor({
        typeId: Number(selectedTypeId),
        assignments,
      }).unwrap();
      toast.success("Đã lưu cấu hình niên hạn quân trang.");
      setMobilePanel("config");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể lưu cấu hình niên hạn."),
      );
    }
  };

  const selectedType =
    militaryTypes.find((type) => String(type.id) === String(selectedTypeId)) ||
    null;

  return (
    <div className="space-y-5">
      <Card className="sticky top-4 z-20 overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
        <div className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-2">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary"
              >
                Thiết lập niên hạn quân trang hàng loạt
              </Badge>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold sm:text-xl">
                  Gắn nhanh quân trang theo loại quân nhân
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Chọn loại quân nhân ở trên, duyệt danh mục bên trái, rồi tinh
                  chỉnh niên hạn và điều kiện áp dụng ở bên phải. Trên màn hình
                  nhỏ, từng quân trang sẽ hiển thị theo thẻ để thao tác thoải
                  mái hơn.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:min-w-[420px]">
              <div className="space-y-1.5">
                <label
                  htmlFor="service-life-editor-type"
                  className="text-sm font-medium"
                >
                  {DISPLAY_LABELS.militaryTypeTitle}
                </label>
                <select
                  id="service-life-editor-type"
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm shadow-sm"
                  value={selectedTypeId}
                  onChange={(event) => setSelectedTypeId(event.target.value)}
                >
                  <option value="">Chọn {DISPLAY_LABELS.militaryType}</option>
                  {militaryTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {formatTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleSave}
                disabled={!selectedTypeId || isSaving}
                className="h-11 rounded-xl px-5 sm:self-end"
              >
                {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill
              label="Loại đang chọn"
              value={selectedType ? formatTypeLabel(selectedType) : "Chưa chọn"}
              tone="accent"
            />
            <StatPill label="Quân trang đã gắn" value={selectedRows.length} />
            <StatPill
              label="Đang hiển thị"
              value={availableCategories.length}
            />
          </div>
        </div>
      </Card>

      {!selectedTypeId ? (
        <Card className="rounded-2xl border-dashed p-5 text-sm text-muted-foreground">
          Vui lòng chọn một loại quân nhân để bắt đầu cấu hình.
        </Card>
      ) : (
        <>
          <div className="grid gap-2 lg:hidden">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-1 shadow-sm">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    mobilePanel === "catalog"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setMobilePanel("catalog")}
                >
                  Danh sách quân trang
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    mobilePanel === "config"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setMobilePanel("config")}
                >
                  Đang cấu hình ({selectedRows.length})
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-primary/70">
                  Tiến độ cấu hình
                </div>
                <div className="mt-1 font-semibold text-primary">
                  {selectedRows.length} quân trang đang được gắn cho loại này
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
                Nhấn vào quân trang để chọn nhanh, sau đó chuyển sang tab bên
                phải để nhập niên hạn và điều kiện.
              </div>
            </div>
          </div>

          <div className="grid gap-5 2xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.28fr)]">
            <Card
              className={`space-y-4 rounded-2xl p-4 shadow-sm ${
                mobilePanel === "config" ? "hidden lg:block" : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">Danh sách quân trang</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Chọn hoặc bỏ chọn quân trang để gắn với loại quân nhân hiện
                    tại.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit">
                  {availableCategories.length} mục
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                  placeholder="Tìm theo tên hoặc mã quân trang"
                  className="h-11 rounded-xl"
                />

                <div className="grid gap-2 sm:grid-cols-2 lg:flex">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleSelectVisible}
                  >
                    Chọn tất cả đang hiển thị
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleClearAll}
                  >
                    Bỏ chọn tất cả
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-foreground">
                    {selectedRows.length}
                  </span>{" "}
                  quân trang đã chọn
                </div>
                <div className="text-muted-foreground">
                  {availableCategories.length} mục đang hiển thị
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {availableCategories.map((category) => {
                  const selected = selectedCategoryIdSet.has(
                    Number(category.id),
                  );
                  return (
                    <div
                      key={category.id}
                      className={`rounded-2xl border p-3 shadow-sm transition ${
                        selected
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/70 bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-medium leading-5">
                            {category.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {category.code || "Không có mã"}
                            {category.unitOfMeasure?.name
                              ? ` • ${category.unitOfMeasure.name}`
                              : ""}
                          </div>
                        </div>
                        <Badge variant={selected ? "default" : "outline"}>
                          {selected ? "Đã chọn" : "Chưa chọn"}
                        </Badge>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant={selected ? "outline" : "default"}
                        className="mt-3 w-full rounded-xl"
                        onClick={() => {
                          toggleCategory(category.id);
                          if (!selected) setMobilePanel("config");
                        }}
                      >
                        {selected
                          ? "Bỏ chọn quân trang này"
                          : "Chọn quân trang này"}
                      </Button>
                    </div>
                  );
                })}

                {!availableCategories.length ? (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    {isLoading || isFetching
                      ? "Đang tải dữ liệu quân trang..."
                      : "Không có quân trang nào khớp bộ lọc."}
                  </div>
                ) : null}
              </div>

              <div className="hidden max-h-[680px] overflow-auto rounded-xl border md:block">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left">
                      <th className="px-3 py-2">Quân trang</th>
                      <th className="px-3 py-2">ĐVT</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableCategories.map((category) => {
                      const selected = selectedCategoryIdSet.has(
                        Number(category.id),
                      );
                      return (
                        <tr
                          key={category.id}
                          className="border-b align-top last:border-0"
                        >
                          <td className="px-3 py-3">
                            <div className="font-medium">{category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.code || "Không có mã"}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {category.unitOfMeasure?.name || "-"}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant={selected ? "default" : "outline"}>
                              {selected ? "Đã chọn" : "Chưa chọn"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Button
                              type="button"
                              size="sm"
                              variant={selected ? "outline" : "default"}
                              className="rounded-xl"
                              onClick={() => toggleCategory(category.id)}
                            >
                              {selected ? "Bỏ chọn" : "Chọn"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {!availableCategories.length ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          {isLoading || isFetching
                            ? "Đang tải dữ liệu quân trang..."
                            : "Không có quân trang nào khớp bộ lọc."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card
              className={`space-y-4 rounded-2xl p-4 shadow-sm ${
                mobilePanel === "catalog" ? "hidden lg:block" : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    Quân trang đã chọn và cấu hình niên hạn
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Thiết lập niên hạn cho từng quân trang, đồng thời chọn điều
                    kiện giới tính hoặc cấp bậc nếu cần.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit border-primary/20 bg-primary/5 text-primary"
                >
                  {selectedRows.length} mục đang cấu hình
                </Badge>
              </div>

              <div className="space-y-3 lg:hidden">
                {selectedRows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-primary/10 bg-gradient-to-br from-card to-primary/[0.03] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium leading-5">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.code || "Không có mã"}
                          {row.unitOfMeasure?.name
                            ? ` • ${row.unitOfMeasure.name}`
                            : ""}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => toggleCategory(row.id)}
                      >
                        Bỏ gắn
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Niên hạn
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={row.serviceLifeYears}
                          onChange={(event) =>
                            setDraftField(
                              row.id,
                              "serviceLifeYears",
                              event.target.value,
                            )
                          }
                          className="h-11 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Điều kiện cấp bậc
                        </label>
                        <select
                          className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
                          value={row.rankGroup}
                          onChange={(event) =>
                            setDraftField(
                              row.id,
                              "rankGroup",
                              event.target.value,
                            )
                          }
                        >
                          {RANK_GROUP_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Điều kiện giới tính
                        </label>
                        <select
                          className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
                          value={row.gender}
                          onChange={(event) =>
                            setDraftField(row.id, "gender", event.target.value)
                          }
                        >
                          {GENDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {!selectedRows.length ? (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    Chưa có quân trang nào được gắn với loại này. Hãy chọn ở
                    danh sách bên trên.
                  </div>
                ) : null}
              </div>

              <div className="hidden max-h-[680px] overflow-auto rounded-xl border lg:block">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left">
                      <th className="px-3 py-2">Quân trang</th>
                      <th className="px-3 py-2">Niên hạn</th>
                      <th className="px-3 py-2">Điều kiện cấp bậc</th>
                      <th className="px-3 py-2">Điều kiện giới tính</th>
                      <th className="px-3 py-2">Bỏ gắn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b align-top last:border-0"
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.code || "Không có mã"}
                            {row.unitOfMeasure?.name
                              ? ` • ${row.unitOfMeasure.name}`
                              : ""}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={row.serviceLifeYears}
                            onChange={(event) =>
                              setDraftField(
                                row.id,
                                "serviceLifeYears",
                                event.target.value,
                              )
                            }
                            className="w-28 rounded-xl"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            className="h-10 min-w-44 rounded-xl border bg-background px-3 text-sm"
                            value={row.rankGroup}
                            onChange={(event) =>
                              setDraftField(
                                row.id,
                                "rankGroup",
                                event.target.value,
                              )
                            }
                          >
                            {RANK_GROUP_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            className="h-10 min-w-44 rounded-xl border bg-background px-3 text-sm"
                            value={row.gender}
                            onChange={(event) =>
                              setDraftField(
                                row.id,
                                "gender",
                                event.target.value,
                              )
                            }
                          >
                            {GENDER_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => toggleCategory(row.id)}
                          >
                            Bỏ gắn
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!selectedRows.length ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Chưa có quân trang nào được gắn với loại này. Hãy chọn
                          ở cột trái.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="sticky bottom-3 z-10 lg:hidden">
            <div className="rounded-2xl border border-primary/20 bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Cấu hình hiện tại
                  </div>
                  <div className="truncate text-sm font-semibold">
                    {selectedRows.length} quân trang đang được gắn
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    setMobilePanel((panel) =>
                      panel === "catalog" ? "config" : "catalog",
                    )
                  }
                >
                  {mobilePanel === "catalog" ? "Xem cấu hình" : "Xem danh sách"}
                </Button>
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={!selectedTypeId || isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
