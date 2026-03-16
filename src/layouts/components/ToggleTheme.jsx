import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ToggleTheme() {
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
