import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Keep hot reload opt-out available for constrained environments.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Allow the Render host so deployed site can access the dev server origin when needed.
      // Add any additional hostnames here if you use other deploy targets.
      allowedHosts: ['gridaanschool.onrender.com'],
    },
  };
});
