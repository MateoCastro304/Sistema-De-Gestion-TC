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

## Estructura

El código se organiza en tres capas: `app/` (arranque), `features/` (módulos
de negocio) y `shared/` (infraestructura técnica). Ver la
[documentación de arquitectura](../docs/architecture/overview.md) del repositorio para más detalles.
