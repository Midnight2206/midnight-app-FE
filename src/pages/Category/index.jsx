import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/utils/apiError";
import CategoryModal from "@/pages/Category/CategoryModal";
import AllocationModesTab from "@/pages/Inventory/components/AllocationModesTab";
import ServiceLifeEditorTab from "@/pages/Inventory/components/ServiceLifeEditorTab";
import {
  useCreateColorMutation,
  useCreateCategoryMutation,
  useCreateVersionMutation,
  useDeleteColorMutation,
  useDeleteCategoryMutation,
  useDeleteVersionMutation,
  useGetCategoryCatalogOptionsQuery,
  useGetCategoriesQuery,
  useGetColorsQuery,
  useRestoreCategoryMutation,
  useUpdateCategoryMutation,
  useGetVersionsQuery,
} from "@/features/category/categoryApi";
import { useGetMilitaryTypesQuery } from "@/features/military/militaryApi";

function normalizeIdList(rawList = []) {
  return [
    ...new Set(
      rawList
        .map((item) => Number.parseInt(item, 10))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

function withFallbackNone(ids, fallbackId) {
  const normalized = normalizeIdList(ids);
  if (normalized.length) return normalized;
  return fallbackId ? [fallbackId] : [];
}

export default function CategoryPage() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [versionName, setVersionName] = useState("");
  const [colorName, setColorName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { data: catalogData, isLoading: isLoadingCatalog } =
    useGetCategoryCatalogOptionsQuery();
  const { data: militaryTypesData } = useGetMilitaryTypesQuery();
  const { data: versionsData, refetch: refetchVersions } = useGetVersionsQuery({
    status: "active",
  });
  const { data: colorsData, refetch: refetchColors } = useGetColorsQuery({
    status: "active",
  });

  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useGetCategoriesQuery({
    status: statusFilter,
    q: search || undefined,
    sortBy: "createdAt",
    order: "desc",
  });
  const { data: serviceLifeCategoryData } = useGetCategoriesQuery({
    status: "active",
    sortBy: "name",
    order: "asc",
  });

  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] =
    useDeleteCategoryMutation();
  const [restoreCategory, { isLoading: isRestoringCategory }] =
    useRestoreCategoryMutation();

  const [createVersion, { isLoading: isCreatingVersion }] =
    useCreateVersionMutation();
  const [deleteVersion, { isLoading: isDeletingVersion }] =
    useDeleteVersionMutation();
  const [createColor, { isLoading: isCreatingColor }] =
    useCreateColorMutation();
  const [deleteColor, { isLoading: isDeletingColor }] =
    useDeleteColorMutation();

  const unitOfMeasures = catalogData?.unitOfMeasures || [];
  const versions = useMemo(
    () => versionsData?.versions || catalogData?.versions || [],
    [versionsData, catalogData],
  );
  const colors = useMemo(
    () => colorsData?.colors || catalogData?.colors || [],
    [colorsData, catalogData],
  );
  const categories = categoryData?.categories || [];
  const serviceLifeCategories = serviceLifeCategoryData?.categories || [];
  const militaryTypes =
    militaryTypesData?.types || militaryTypesData?.militaryTypes || [];

  const defaultVersionId = useMemo(
    () =>
      versions.find((item) => String(item.name || "").toLowerCase() === "none")
        ?.id,
    [versions],
  );
  const defaultColorId = useMemo(
    () =>
      colors.find((item) => String(item.name || "").toLowerCase() === "none")
        ?.id,
    [colors],
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      code: category.code || "",
      unitOfMeasureId: category.unitOfMeasure?.id,
      totalQuantity: category.totalQuantity ?? 0,
      sizes: (category.sizes || []).map((size) => size.name),
      versionIds: normalizeIdList(
        (category.versions || []).map((version) => version.id).length
          ? (category.versions || []).map((version) => version.id)
          : category.version?.id
            ? [category.version.id]
            : defaultVersionId
              ? [defaultVersionId]
              : [],
      ),
      colorIds: normalizeIdList(
        (category.colors || []).map((color) => color.id).length
          ? (category.colors || []).map((color) => color.id)
          : category.color?.id
            ? [category.color.id]
            : defaultColorId
              ? [defaultColorId]
              : [],
      ),
    });
    setModalOpen(true);
  };

  const handleCategoryModalSubmit = async (payload) => {
    try {
      const requestData = {
        ...payload,
        versionIds: withFallbackNone(payload.versionIds, defaultVersionId),
        colorIds: withFallbackNone(payload.colorIds, defaultColorId),
      };

      if (editingCategory?.id) {
        await updateCategory({
          id: editingCategory.id,
          data: requestData,
        }).unwrap();
        toast.success("Đã cập nhật danh mục.");
      } else {
        await createCategory(requestData).unwrap();
        toast.success("Đã tạo danh mục.");
      }

      setModalOpen(false);
      setEditingCategory(null);
      refetchCategories();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu danh mục."));
      throw error;
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá danh mục này?")) return;

    try {
      await deleteCategory(id).unwrap();
      toast.success("Đã xoá danh mục.");
      refetchCategories();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xoá danh mục."));
    }
  };

  const handleRestoreCategory = async (id) => {
    try {
      await restoreCategory(id).unwrap();
      toast.success("Đã khôi phục danh mục.");
      refetchCategories();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể khôi phục danh mục."));
    }
  };

  const handleCreateVersion = async (event) => {
    event.preventDefault();
    if (!versionName.trim()) return;

    try {
      await createVersion({ name: versionName.trim() }).unwrap();
      setVersionName("");
      toast.success("Đã thêm phiên bản.");
      refetchVersions();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể thêm phiên bản."));
    }
  };

  const handleDeleteVersion = async (id) => {
    if (!window.confirm("Xoá phiên bản này?")) return;

    try {
      await deleteVersion(id).unwrap();
      toast.success("Đã xoá phiên bản.");
      refetchVersions();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xoá phiên bản."));
    }
  };

  const handleCreateColor = async (event) => {
    event.preventDefault();
    if (!colorName.trim()) return;

    try {
      await createColor({ name: colorName.trim() }).unwrap();
      setColorName("");
      toast.success("Đã thêm màu sắc.");
      refetchColors();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể thêm màu sắc."));
    }
  };

  const handleDeleteColor = async (id) => {
    if (!window.confirm("Xoá màu sắc này?")) return;

    try {
      await deleteColor(id).unwrap();
      toast.success("Đã xoá màu sắc.");
      refetchColors();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xoá màu sắc."));
    }
  };

  if (isLoadingCatalog) {
    return (
      <div className="p-6">
        <Card className="p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu danh mục...
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Tabs defaultValue="categories" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="categories">Danh mục quân trang</TabsTrigger>
            <TabsTrigger value="versions">Phiên bản</TabsTrigger>
            <TabsTrigger value="colors">Màu sắc</TabsTrigger>
            <TabsTrigger value="service-life">Niên hạn quân trang</TabsTrigger>
            <TabsTrigger value="allocation-modes">Chế độ cấp phát</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="categories">
          <Card className="p-4 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="font-semibold">Danh mục quân trang</h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên"
                  className="w-full sm:w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-auto"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="deleted">Đã xoá</option>
                  <option value="all">Tất cả</option>
                </select>
                <Button
                  type="button"
                  onClick={openCreateModal}
                  className="w-full sm:w-auto"
                >
                  Thêm danh mục
                </Button>
              </div>
            </div>

            {isLoadingCategories ? (
              <div className="text-sm text-muted-foreground">
                Đang tải danh sách danh mục...
              </div>
            ) : (
              <div className="overflow-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-background">
                    <tr className="text-left border-b">
                      <th className="py-2 px-3">Tên</th>
                      <th className="py-2 px-3">Mã</th>
                      <th className="py-2 px-3">Cỡ số</th>
                      <th className="py-2 px-3">ĐVT</th>
                      <th className="py-2 px-3">Phiên bản</th>
                      <th className="py-2 px-3">Màu sắc</th>
                      <th className="py-2 px-3">Tồn</th>
                      <th className="py-2 px-3">Trạng thái</th>
                      <th className="py-2 px-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-b last:border-0 align-top"
                      >
                        <td className="py-2 px-3">{category.name}</td>
                        <td className="py-2 px-3">{category.code || "-"}</td>
                        <td className="py-2 px-3">
                          {(category.sizes || [])
                            .map((item) => item.name)
                            .join(", ") || "Một cỡ"}
                        </td>
                        <td className="py-2 px-3">
                          {category.unitOfMeasure?.name || "-"}
                        </td>
                        <td className="py-2 px-3">
                          {(category.versions || [])
                            .map((item) => item.name)
                            .join(", ") ||
                            category.version?.name ||
                            "Mặc định"}
                        </td>
                        <td className="py-2 px-3">
                          {(category.colors || [])
                            .map((item) => item.name)
                            .join(", ") ||
                            category.color?.name ||
                            "Mặc định"}
                        </td>
                        <td className="py-2 px-3">
                          {category.totalQuantity ?? 0}
                        </td>
                        <td className="py-2 px-3">
                          {category.deletedAt ? "Đã xoá" : "Hoạt động"}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => openEditModal(category)}
                            >
                              Sửa
                            </Button>
                            {category.deletedAt ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRestoreCategory(category.id)
                                }
                                disabled={isRestoringCategory}
                              >
                                Khôi phục
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                                disabled={isDeletingCategory}
                              >
                                Xoá
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!categories.length ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-4 text-center text-muted-foreground"
                        >
                          Chưa có danh mục nào.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="service-life">
          <ServiceLifeEditorTab
            militaryTypes={militaryTypes}
            categories={serviceLifeCategories}
          />
        </TabsContent>

        <TabsContent value="allocation-modes">
          <AllocationModesTab
            categories={serviceLifeCategories}
            militaryTypes={militaryTypes}
          />
        </TabsContent>

        <TabsContent value="versions">
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">Phiên bản</h2>
            <form
              onSubmit={handleCreateVersion}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                value={versionName}
                onChange={(event) => setVersionName(event.target.value)}
                placeholder="Tên phiên bản"
              />
              <Button
                type="submit"
                disabled={isCreatingVersion}
                className="w-full sm:w-auto"
              >
                {isCreatingVersion ? "Đang thêm..." : "Thêm"}
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-md border px-2 py-1 text-sm flex items-center gap-2"
                >
                  <span>{version.name}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVersion(version.id)}
                    disabled={
                      isDeletingVersion ||
                      String(version.name || "").toLowerCase() === "none"
                    }
                  >
                    Xoá
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">Màu sắc</h2>
            <form
              onSubmit={handleCreateColor}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                value={colorName}
                onChange={(event) => setColorName(event.target.value)}
                placeholder="Tên màu sắc"
              />
              <Button
                type="submit"
                disabled={isCreatingColor}
                className="w-full sm:w-auto"
              >
                {isCreatingColor ? "Đang thêm..." : "Thêm"}
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <div
                  key={color.id}
                  className="rounded-md border px-2 py-1 text-sm flex items-center gap-2"
                >
                  <span>{color.name}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteColor(color.id)}
                    disabled={
                      isDeletingColor ||
                      String(color.name || "").toLowerCase() === "none"
                    }
                  >
                    Xoá
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <CategoryModal
        open={modalOpen}
        onOpenChange={(next) => {
          setModalOpen(next);
          if (!next) setEditingCategory(null);
        }}
        onSubmit={handleCategoryModalSubmit}
        initialData={editingCategory}
        unitOfMeasures={unitOfMeasures}
        versions={versions}
        colors={colors}
      />
    </div>
  );
}
