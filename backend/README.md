# Backend — Tornería Castro

API del sistema de gestión del taller (NestJS + TypeScript, Prisma y PostgreSQL).

## Primeros pasos

El flujo habitual ejecuta el backend dentro de Docker junto con el frontend y PostgreSQL: ver [SETUP.md](../docs/SETUP.md). Desde la raíz del repositorio:

```bash
make dev-up
make migrate-dev
make seed
```

La API queda disponible en `http://localhost:3000` (o en `http://localhost/api` a través de Nginx).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run start:dev` | Servidor de desarrollo con recarga automática |
| `npm run start:debug` | Servidor de desarrollo con depurador |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run start:prod` | Ejecuta la compilación de producción |
| `npm run lint` / `npm run lint:fix` | Linter (sin advertencias permitidas) / corrección automática |
| `npm run format` / `npm run format:check` | Formatea con Prettier / verifica el formato |
| `npm test` | Pruebas unitarias (`src/**/*.spec.ts`) |
| `npm run test:cov` | Pruebas unitarias con cobertura |
| `npm run test:int` | Pruebas de integración contra PostgreSQL real (Testcontainers) |
| `npm run test:api` | Heredado: solo `test/modules/supplier/api/`, pendiente de unificar en `test:int` (A-06) |
| `npm run prisma:generate` | Genera Prisma Client |
| `npm run prisma:migrate-dev` / `npm run prisma:migrate-deploy` | Migraciones de desarrollo / despliegue |

Las migraciones se ejecutan normalmente con `make migrate-dev` y `make migrate-deploy`: ver [Migraciones de base de datos con Prisma](../docs/uso-ORM-DB/Migrations.md).

## Más información

- [Arquitectura del sistema](../docs/arquitectura/overview.md) y decisiones [ADR-001](../docs/decisiones/001-backend-framework.md) (NestJS), [ADR-003](../docs/decisiones/003-orm.md) (Prisma) y [ADR-005](../docs/decisiones/005-autentication.md) (autenticación).
- [Suite de pruebas de integración](test/README.md) y [pruebas del backend](../docs/testing/pruebas-backend.md).
- [Contrato OpenAPI](../docs/openapi/openapi.yaml) y [verificaciones de CI](../docs/decisiones/010-continuous-integration.md).
