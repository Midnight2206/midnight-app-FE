import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowUpDown, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const SORT_LABELS = {
  name: "Tên",
  createdAt: "Ngày tạo",
};

function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const CategoryTableFilters = memo(function CategoryTableFilters({
  onSearchChange,
  sortBy,
  setSortBy,
  order,
  toggleSortOrder,
  totalCount,
  isFetching,
}) {
  const [localValue, setLocalValue] = useState("");
  const debouncedValue = useDebounce(localValue, 400);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  const handleClear = useCallback(() => {
    setLocalValue("");
  }, []);

  const handleChange = useCallback((e) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <div className="px-6 py-3 flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <Input
          placeholder="Tìm kiếm danh mục..."
          value={localValue}
          onChange={handleChange}
          className="pl-9 pr-8 h-9"
        />

        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-sm"
            type="button"
            aria-label="Xoá tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ===== SORT ===== */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Sắp xếp theo:
        </span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue>{SORT_LABELS[sortBy]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name" label="Tên">
              Tên
            </SelectItem>
            <SelectItem value="createdAt" label="Ngày tạo">
              Ngày tạo
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleSortOrder}
          className="h-9 px-3"
        >
          <ArrowUpDown className="w-4 h-4 mr-1" />
          {order === "asc" ? "A→Z" : "Z→A"}
        </Button>
      </div>

      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {isFetching ? "Đang tải..." : `${totalCount} danh mục`}
      </span>
    </div>
  );
});

export default CategoryTableFilters;
