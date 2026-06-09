import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: env.VITE_HOST || "0.0.0.0",
      port: Number(env.VITE_PORT || 5173),
      allowedHosts: true,
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_ORIGIN || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
  };
});