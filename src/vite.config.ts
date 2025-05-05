
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy para el backend de Flask 
      '/api': {
        target: 'http://localhost:5000', // Asumiendo que Flask corre en el puerto 5000
        changeOrigin: true,
        secure: false
      }
    }
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
    'process.env': {},
    'process.browser': true,
    'process': { env: {} }
  },
  optimizeDeps: {
    exclude: ['yahoo-finance2', 'tough-cookie'] // Excluir módulos Node.js
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
}));
