import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordInput({
  label = "Mật khẩu",
  name,
  register,
  error,
  placeholder = "••••••••",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const registerField = typeof register === "function" && name ? register(name) : {};

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

        <Input
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="pl-11 pr-11 h-12"
          {...registerField}
        />

        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
