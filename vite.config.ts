
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Rely on environment variables provided at build/runtime
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || ""),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    },
  };
});
