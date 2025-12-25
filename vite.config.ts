import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inyectamos la API Key directamente para que funcione en Vercel sin configuración extra
    'process.env.API_KEY': JSON.stringify("AIzaSyCfOp-7g_Hc_eCWIWhATd2cquXORlaYEl4")
  }
});