import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // Permite escribir '@/shared/api/http' en vez de '../../../../shared/api/http'.
      // Este alias tiene que coincidir con "paths" en tsconfig.app.json: Vite y
      // TypeScript son dos programas distintos y ninguno lee la config del otro.
      //
      // fileURLToPath(new URL(...)) es la forma ESM de resolver rutas: este archivo
      // es un modulo ESM ("type": "module" en package.json), asi que __dirname no existe.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    proxy: {
      // En produccion nginx recibe todo y reparte (ADR-009), asi que el frontend
      // puede pedir '/api/...' sin saber donde vive el backend. En desarrollo no hay
      // nginx: la pagina la sirve Vite en :5173 y el backend corre aparte en :3000.
      // Sin esta regla, '/api/clientes' pegaria contra Vite y devolveria un 404.
      //
      // El reenvio lo hace Vite (servidor a servidor), no el navegador, asi que
      // tampoco hay problema de CORS.
      //
      // Sin rewrite: el contrato de endpoints define las rutas con el prefijo
      // '/api' (GET /api/clientes), asi que el backend va a exponerlas con ese
      // prefijo via setGlobalPrefix('api') y la ruta pasa tal cual.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
