import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // specific compatibility for generic process.env calls if needed, 
    // but we prefer import.meta.env for Vite
    'process.env': {}
  }
});