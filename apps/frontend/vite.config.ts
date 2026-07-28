import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|scheduler)([\\/]|$)/,
            },
            {
              name: "router",
              test: /node_modules[\\/]react-router([\\/]|$)/,
            },
            {
              name: "query",
              test: /node_modules[\\/]@tanstack[\\/]react-query([\\/]|$)/,
            },
            {
              name: "socket",
              test: /node_modules[\\/]socket\.io-client([\\/]|$)/,
            },
            {
              name: "forms",
              test: /node_modules[\\/](react-hook-form|@hookform[\\/]resolvers)([\\/]|$)/,
            },
          ],
        },
      },
    },
  },
});
