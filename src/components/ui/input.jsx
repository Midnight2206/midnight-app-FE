import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, onWheel, ...props }) {
  const handleWheel = (event) => {
    onWheel?.(event);
    if (type === "number" && document.activeElement === event.currentTarget) {
      event.currentTarget.blur();
    }
  };

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      onWheel={handleWheel}
      className={cn(
        "bg-input/45 dark:bg-input/40 border-input focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-10 rounded-xl border px-3 py-2 text-sm transition-all duration-200 file:h-8 file:text-sm file:font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] placeholder:text-muted-foreground/90 w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 shadow-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
