import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ecb-xml": {
        target: "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ecb-xml/, ""),
        // Remove path so /ecb-xml -> /
        configure: (proxy, _) => {
          proxy.on("proxyReq", (proxyReq, __, ___) => {
            proxyReq.path = "/stats/eurofxref/eurofxref-daily.xml";
          });
        },
      },
    },
  },
});
