import { Package, Tag, Calendar, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CategoryStats({ categories, statusFilter }) {
  const totalSizes = categories.reduce((t, c) => t + (c.sizes?.length || 0), 0);

  // Determine label based on filter
  const getCountLabel = () => {
    if (statusFilter === "deleted") return "Đã xóa";
    if (statusFilter === "all") return "Tổng cộng";
    return "Tổng danh mục";
  };

  const getCountStatus = () => {
    if (statusFilter === "deleted") return "Có thể khôi phục";
    if (statusFilter === "all") return "Đang theo dõi";
    return "Đang hoạt động";
  };

  const getDateLabel = () => {
    if (statusFilter === "deleted") return "Xóa gần nhất";
    if (statusFilter === "all") return "Thay đổi gần nhất";
    return "Cập nhật gần nhất";
  };

  // Calculate latest date based on filter
  const getLatestDate = () => {
    if (categories.length === 0) return "Chưa có";

    let dates;
    if (statusFilter === "all") {
      // Get the most recent date from either createdAt or deletedAt
      dates = categories.map((c) => {
        const created = new Date(c.createdAt).getTime();
        const deleted = c.deletedAt ? new Date(c.deletedAt).getTime() : 0;
        return Math.max(created, deleted);
      });
    } else if (statusFilter === "deleted") {
      dates = categories.map((c) => new Date(c.deletedAt).getTime());
    } else {
      dates = categories.map((c) => new Date(c.createdAt).getTime());
    }

    return new Date(Math.max(...dates)).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              {getCountLabel()}
            </p>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Package className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-4xl font-bold text-primary">{categories.length}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>{getCountStatus()}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Tổng size
            </p>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Tag className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-4xl font-bold text-primary">{totalSizes}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>Đa dạng</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              {getDateLabel()}
            </p>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-xl font-bold text-foreground">{getLatestDate()}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>Hôm nay</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
