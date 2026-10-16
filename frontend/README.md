# Frontend — Tornería Castro

SPA de gestión del taller (React + TypeScript).

## Requisitos

- Node.js 20+

## Primeros pasos

```bash
npm install
cp .env.example .env.local   # ajustar VITE_API_URL si es necesario
npm run dev
```

## Scripts

| Comando           | Descripción                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Servidor de desarrollo            |
| `npm run build`   | Compilación de producción en `dist/` |
| `npm run preview` | Sirve la compilación para verificarla |
| `npm run lint`    | Linter                            |
| `npm run test:e2e` | Tests E2E con Playwright (ver [TESTING.md](frontend-Documents/TESTING.md)) |

Para trabajar sin backend, los mocks de la API se prenden con `VITE_USE_MOCKS=true` en `.env.local` (ver [MOCKS.md](frontend-Documents/MOCKS.md)).

## Estructura

El código se organiza en tres capas: `app/` (arranque), `features/` (módulos
de negocio) y `shared/` (infraestructura técnica). Ver la
[documentación de arquitectura](../docs/arquitectura/overview.md) del repositorio para más detalles.
