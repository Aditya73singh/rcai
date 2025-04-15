import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cartographerPluginVite } from "@replit/vite-plugin-cartographer";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import shadcnThemeJson from '@replit/vite-plugin-shadcn-theme-json';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    cartographerPluginVite({ 
      projectRoot: "client", 
    }),
    shadcnThemeJson({
      // Exclude theme.json from types generation
      noTypescriptGeneration: true,
    }),
    runtimeErrorModal(),
  ],
  root: "client",
  publicDir: "public",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  server: {
    port: 5000,
    strictPort: true,
    hmr: {
      clientPort: 5000,
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});
