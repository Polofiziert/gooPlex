import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const serverPort = Number(process.env.PORT ?? 3001);

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true,
      },
    },
  },
});
