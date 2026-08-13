# ADR-002 — Base de Datos

**Fecha:** 2026-08  
**Estado:** Recomendado (pendiente confirmación formal)  
**Decisores:** Equipo técnico

---

## Contexto

El sistema maneja un dominio relacional complejo: cotizaciones con múltiples ítems (Composite), órdenes de trabajo con procesos planificados y ejecutados, historial de cambios de precio, SEQUENCE para números correlativos, y relaciones entre clientes, piezas y planos.

## Opciones evaluadas

### Opción A: PostgreSQL ✅ Recomendada

Base de datos relacional con soporte nativo para SEQUENCEs, constraints de integridad, transacciones ACID, JSON para datos semiestructurados cuando sea necesario, y vistas para reportes.

**A favor:**
- SEQUENCEs nativas para el número correlativo de presupuesto (RN-04) — único enfoque correcto bajo concurrencia.
- Constraints a nivel de base de datos como segunda línea de defensa para invariantes críticos (precio inmutable post-adjudicación).
- Soporte robusto para queries de reportes y estadísticas.
- Ecosistema maduro con Prisma y TypeORM.
- Herramientas de migración estables.

**En contra:**
- Ninguno relevante para este caso de uso.

### Opción B: MySQL / MariaDB

Similar en capacidades generales, pero con un ecosistema de herramientas algo más limitado en el contexto Node.js y con menor expresividad en SEQUENCEs (AUTO_INCREMENT no es equivalente en todos los escenarios).

### Opción C: MongoDB

Base de datos documental. Inadecuada para este dominio: el sistema tiene relaciones fuertes, integridad referencial crítica, y necesita SEQUENCEs que no existen nativamente en MongoDB.

## Decisión

**PostgreSQL**. Es la única opción correcta para este dominio relacional. Las SEQUENCEs para el número correlativo y las constraints para las invariantes de precio no tienen sustituto adecuado en otras opciones.

## Notas de implementación

- Usar `CREATE SEQUENCE` para el número de presupuesto, no `MAX(id) + 1` en la aplicación.
- Evaluar constraints de base de datos para el bloqueo de precio post-adjudicación.
- Usar migraciones versionadas desde el inicio (Prisma Migrate o Flyway).
