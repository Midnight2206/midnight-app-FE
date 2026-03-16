import { X, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function ChipInput({
  value = [],
  onChange,
  placeholder = "Nhập và Enter để thêm...",
  className,
  presets = [],
  label = "Danh sách",
  duplicateMessage = "Mục đã tồn tại: ",
}) {
  const [input, setInput] = useState("");
  const composingRef = useRef(false);

  const addItem = (raw) => {
    const item = raw.trim();
    if (!item) return;
    if (value.includes(item)) {
      toast.error(duplicateMessage + item);
      return;
    }
    onChange([...value, item]);
    setInput("");
  };

  const addPreset = (items) => {
    const newItems = items.filter((item) => !value.includes(item));
    if (newItems.length > 0) {
      onChange([...value, ...newItems]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
    if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter" && !composingRef.current) {
      addItem(input);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input */}
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onCompositionStart={() => (composingRef.current = true)}
          onCompositionEnd={() => (composingRef.current = false)}
          placeholder={placeholder}
          className="pr-10"
        />
        {input && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addItem(input)}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Preset nhanh:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, i) => (
              <Button
                key={i}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPreset(preset.items)}
                className="h-8 text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/30"
              >
                <Plus className="mr-1 h-3 w-3" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Chips */}
      {value.length > 0 ? (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {label} ({value.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa tất cả
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/20 hover:bg-primary/20 hover:ring-primary/30 transition-all"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== item))}
                  className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Chưa có dữ liệu. Sử dụng preset hoặc nhập và nhấn Enter để thêm.
          </p>
        </div>
      )}
    </div>
  );
}
