
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Provide proper shims for the process object Yahoo Finance might be using
    'process.env': {},
    'process.browser': true,
    'process': { env: {} }
  },
  optimizeDeps: {
    exclude: ['yahoo-finance2', 'tough-cookie'] // Exclude problematic Node.js packages from optimization
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true // Might help with mixed module formats
    }
  }
}));
