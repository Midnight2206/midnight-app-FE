import { Package, Archive, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoryTableEmpty({
  statusFilter,
  searchQuery,
  onAddClick,
}) {
  const getIcon = () => {
    if (statusFilter === "deleted")
      return <Archive className="w-12 h-12 text-muted-foreground/50 mx-auto" />;
    if (statusFilter === "all")
      return <List className="w-12 h-12 text-muted-foreground/50 mx-auto" />;
    return <Package className="w-12 h-12 text-muted-foreground/50 mx-auto" />;
  };

  const getMessage = () => {
    if (searchQuery) return "Không tìm thấy danh mục nào";
    if (statusFilter === "deleted") return "Chưa có danh mục bị xóa";
    if (statusFilter === "all") return "Chưa có danh mục nào";
    return "Chưa có danh mục nào";
  };

  return (
    <div className="flex items-center justify-center h-full py-12">
      <div className="text-center space-y-3">
        {getIcon()}
        <p className="text-muted-foreground">{getMessage()}</p>
        {statusFilter === "false" && !searchQuery && (
          <Button variant="outline" className="gap-2" onClick={onAddClick}>
            <Plus className="w-4 h-4" />
            Thêm danh mục đầu tiên
          </Button>
        )}
      </div>
    </div>
  );
}
