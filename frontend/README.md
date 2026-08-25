# Frontend — Tornería Castro

Workshop management SPA (React + TypeScript).

## Requirements

- Node.js 20+

## Getting started

```bash
npm install
cp .env.example .env.local   # adjust VITE_API_URL if needed
npm run dev
```

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Development server                |
| `npm run build`   | Production build in `dist/`       |
| `npm run preview` | Serve the build to verify it      |
| `npm run lint`    | Linter                            |

## Structure

The code is organized in three layers: `app/` (bootstrap), `features/` (business
modules) and `shared/` (technical infrastructure). See the repository's
architecture documentation for details.
