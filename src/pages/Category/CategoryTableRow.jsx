import { Edit2, Trash2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CategoryTableRow({
  category,
  index,
  statusFilter,
  onEdit,
  onDelete,
  onRestore,
  isDeleting,
  isRestoring,
  deleteId,
  disabled,
}) {
  const isDeleted = !!category.deletedAt;
  const showDeletedStyle =
    statusFilter === "deleted" || (statusFilter === "all" && isDeleted);
  const showAll = statusFilter === "all";

  return (
    <tr
      className="hover:bg-muted/50 group transition-all duration-200 animate-fade-in"
      style={{
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* NAME */}
      <td className="px-6 py-4 w-[25%]">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 ${
              showDeletedStyle ? "bg-muted" : "bg-primary"
            }`}
          >
            <span
              className={`font-bold text-sm ${
                showDeletedStyle
                  ? "text-muted-foreground"
                  : "text-primary-foreground"
              }`}
            >
              {category.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex flex-col">
            <span
              className={`font-semibold transition-colors ${
                showDeletedStyle
                  ? "text-muted-foreground line-through"
                  : "text-foreground group-hover:text-primary"
              }`}
            >
              {category.name}
            </span>
            {showAll && isDeleted && (
              <Badge
                variant="outline"
                className="w-fit mt-1 text-xs text-destructive border-destructive/30"
              >
                Đã xóa
              </Badge>
            )}
          </div>
        </div>
      </td>

      {/* SIZES */}
      <td className="px-6 py-4 w-[30%]">
        <div className="flex flex-wrap gap-2">
          {category.sizes?.length > 0 ? (
            category.sizes.map((s) => (
              <Badge
                key={s.id}
                variant="secondary"
                className="hover:bg-primary/20 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
              >
                {s.name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Chưa có size</span>
          )}
        </div>
      </td>

      {/* DATE */}
      <td className="px-6 py-4 w-[20%]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className={`w-2 h-2 rounded-full group-hover:animate-pulse ${
                showDeletedStyle ? "bg-red-400" : "bg-green-400"
              }`}
            ></div>
            {new Date(
              isDeleted ? category.deletedAt : category.createdAt,
            ).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
          {showAll && !isDeleted && (
            <span className="text-xs text-muted-foreground ml-4">
              Đang hoạt động
            </span>
          )}
        </div>
      </td>

      {/* ACTIONS */}
      <td className="px-6 py-4 w-[25%]">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {isDeleted ? (
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
              onClick={() => onRestore(category)}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                onClick={() => onEdit(category)}
                disabled={disabled}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-destructive/10 text-destructive hover:border-destructive/30 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                onClick={() => onDelete(category.id)}
                disabled={isDeleting}
              >
                {isDeleting && deleteId === category.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
