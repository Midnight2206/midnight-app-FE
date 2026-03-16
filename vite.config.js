import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
            return "vendor-react";
          }

          if (id.includes("@reduxjs") || id.includes("redux-persist") || id.includes("axios")) {
            return "vendor-state";
          }

          if (id.includes("lucide-react") || id.includes("@radix-ui") || id.includes("sonner")) {
            return "vendor-ui";
          }

          if (id.includes("xlsx")) {
            return "vendor-xlsx";
          }

          return "vendor-misc";
        },
      },
    },
  },
});
