import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Standalone build: IIFE format so the output works as a plain <script>
// (no import.meta, no dynamic imports, no module CORS issues on file://)
export default defineConfig({
  plugins: [
    react(),
    {
      // Replace import.meta.env references before bundling
      name: 'replace-import-meta',
      transform(code) {
        return code
          .replace(/import\.meta\.env\.MODE/g, '"production"')
          .replace(/import\.meta\.env\.DEV/g, 'false')
          .replace(/import\.meta\.env\.PROD/g, 'true')
          .replace(/import\.meta\.env\.SSR/g, 'false')
          .replace(/import\.meta\.env/g, '{}')
          .replace(/import\.meta\.hot/g, 'undefined')
          .replace(/import\.meta/g, '({})')
      },
    },
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist-standalone',
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'Audit360App',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
    target: 'es2015',
  },
})
