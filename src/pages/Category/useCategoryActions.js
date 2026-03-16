import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
} from "@/features/category/categoryApi";
import { getApiErrorMessage } from "@/utils/apiError";

export function useCategoryActions() {
  const [deleteId, setDeleteId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [restoreDialog, setRestoreDialog] = useState(null);
  const [keepOldSizes, setKeepOldSizes] = useState(false);

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();
  const [restoreCategory, { isLoading: isRestoring }] =
    useRestoreCategoryMutation();

  const handleSubmit = async (formData) => {
    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          data: formData,
        }).unwrap();

        toast.success("Thành công", {
          description: "Đã cập nhật danh mục thành công",
        });

        setOpenModal(false);
        setEditingCategory(null);
      } else {
        await createCategory(formData).unwrap();

        toast.success("Thành công", {
          description: "Đã thêm danh mục mới thành công",
        });

        setOpenModal(false);
        setEditingCategory(null);
      }
    } catch (err) {
      if (err?.data?.errorCode === "CATEGORY_NAME_DELETED") {
        const deletedCategory = err?.data?.metadata?.deletedCategory;

        setRestoreDialog({
          id: deletedCategory.id,
          name: formData.name,
          newSizes: formData.sizes,
          oldSizes: deletedCategory.sizes?.map((s) => s.name) || [],
          deletedAt: deletedCategory.deletedAt,
        });

        return;
      }

      toast.error("Lỗi", {
        description:
          getApiErrorMessage(
          err,
          `Không thể ${editingCategory ? "cập nhật" : "thêm"} danh mục`,
        ),
      });
    }
  };

  const handleRestoreConfirm = async () => {
    try {
      await restoreCategory(restoreDialog.id).unwrap();

      if (!keepOldSizes && restoreDialog.newSizes.length > 0) {
        await updateCategory({
          id: restoreDialog.id,
          data: {
            name: restoreDialog.name,
            sizes: restoreDialog.newSizes,
          },
        }).unwrap();
      }

      toast.success("Thành công", {
        description: `Đã khôi phục danh mục "${restoreDialog.name}"`,
      });

      setRestoreDialog(null);
      setKeepOldSizes(false);
      setOpenModal(false);
      setEditingCategory(null);
    } catch (err) {
      toast.error("Lỗi", {
        description: getApiErrorMessage(err, "Không thể khôi phục danh mục"),
      });
    }
  };

  const handleRestoreFromList = async (category) => {
    try {
      await restoreCategory(category.id).unwrap();

      toast.success("Thành công", {
        description: `Đã khôi phục danh mục "${category.name}"`,
      });
    } catch (err) {
      toast.error("Lỗi", {
        description: getApiErrorMessage(err, "Không thể khôi phục danh mục"),
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      sizes: category.sizes?.map((s) => s.name) || [],
    });
    setOpenModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory(deleteId).unwrap();
      toast.success("Thành công", {
        description: "Đã xóa danh mục thành công",
      });
      setDeleteId(null);
    } catch (err) {
      toast.error("Lỗi", {
        description: getApiErrorMessage(err, "Không thể xóa danh mục"),
      });
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setOpenModal(true);
  };

  return {
    // States
    deleteId,
    setDeleteId,
    openModal,
    setOpenModal,
    editingCategory,
    restoreDialog,
    setRestoreDialog,
    keepOldSizes,
    setKeepOldSizes,

    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    isRestoring,

    // Actions
    handleSubmit,
    handleEdit,
    handleDeleteConfirm,
    handleRestoreConfirm,
    handleRestoreFromList,
    handleAddNew,
  };
}
