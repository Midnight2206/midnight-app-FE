import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OverlayLoader, SectionLoader } from "@/components/AppLoading";
import { getApiErrorMessage } from "@/utils/apiError";

export default function AssignedUnitManagementTab({
  canManageAssignedUnits,
  selectedScopeUnitId,
  selectedScopeUnitName,
  isSuperAdmin,
  isLoading,
  isFetching,
  error,
  assignedUnits,
  onCreateAssignedUnit,
  isCreatingAssignedUnit,
  onUpdateAssignedUnit,
  isUpdatingAssignedUnit,
  onDeleteAssignedUnit,
  isDeletingAssignedUnit,
}) {
  const [newAssignedUnitName, setNewAssignedUnitName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  if (!canManageAssignedUnits) {
    return null;
  }

  if (isSuperAdmin && !selectedScopeUnitId) {
    return (
      <Card className="surface p-6 text-sm text-muted-foreground">
        Chọn một đơn vị ở bộ lọc phía trên để quản lý danh mục assignedUnit.
      </Card>
    );
  }

  const handleCreate = async (event) => {
    event.preventDefault();
    const name = String(newAssignedUnitName || "").trim();
    if (!name) {
      toast.error("Vui lòng nhập tên assigned unit.");
      return;
    }

    try {
      await onCreateAssignedUnit(name);
      setNewAssignedUnitName("");
      toast.success("Đã thêm assigned unit.");
    } catch (errorValue) {
      toast.error(getApiErrorMessage(errorValue, "Không thể thêm assigned unit."));
    }
  };

  const handleSaveEdit = async () => {
    const name = String(editingName || "").trim();
    if (!editingId) return;
    if (!name) {
      toast.error("Vui lòng nhập tên assigned unit.");
      return;
    }

    try {
      await onUpdateAssignedUnit({ assignedUnitId: editingId, name });
      setEditingId(null);
      setEditingName("");
      toast.success("Đã cập nhật assigned unit.");
    } catch (errorValue) {
      toast.error(getApiErrorMessage(errorValue, "Không thể cập nhật assigned unit."));
    }
  };

  const handleDelete = async (assignedUnitId) => {
    try {
      await onDeleteAssignedUnit({ assignedUnitId });
      toast.success("Đã xóa assigned unit.");
    } catch (errorValue) {
      toast.error(getApiErrorMessage(errorValue, "Không thể xóa assigned unit."));
    }
  };

  if (isLoading) {
    return (
      <Card className="surface p-6">
        <SectionLoader label="Đang tải danh mục assignedUnit..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="surface p-6">
        <SectionLoader
          label={getApiErrorMessage(error, "Không tải được danh mục assignedUnit.")}
          textClassName="text-destructive"
        />
      </Card>
    );
  }

  return (
    <Card className="relative surface overflow-hidden">
      <OverlayLoader show={isFetching && !isLoading} label="Đang cập nhật danh mục assignedUnit..." />
      <div className="border-b px-4 py-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Danh mục assignedUnit của đơn vị</h3>
          <p className="text-xs text-muted-foreground">
            Đơn vị đang quản lý: <span className="font-medium text-foreground">{selectedScopeUnitName || "-"}</span>
          </p>
        </div>
        <form className="flex flex-col gap-2 md:flex-row" onSubmit={handleCreate}>
          <Input
            value={newAssignedUnitName}
            onChange={(event) => setNewAssignedUnitName(event.target.value)}
            placeholder="Nhập tên assignedUnit mới"
            className="md:max-w-md"
          />
          <Button type="submit" disabled={isCreatingAssignedUnit} className="gap-2">
            <Plus className="h-4 w-4" />
            {isCreatingAssignedUnit ? "Đang thêm..." : "Thêm assignedUnit"}
          </Button>
        </form>
      </div>

      <div className="data-table-wrap border-0 rounded-none">
        <table className="data-table min-w-[760px]">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên assignedUnit</th>
              <th>Đơn vị</th>
              <th>Cập nhật</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {assignedUnits.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có assignedUnit nào cho đơn vị này.
                </td>
              </tr>
            ) : (
              assignedUnits.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          placeholder="Nhập tên assignedUnit"
                          className="max-w-sm"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td>{item.unit?.name || selectedScopeUnitName || "-"}</td>
                    <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "-"}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={isUpdatingAssignedUnit}
                            >
                              {isUpdatingAssignedUnit ? "Đang lưu..." : "Lưu"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditingName(item.name);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeletingAssignedUnit}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
