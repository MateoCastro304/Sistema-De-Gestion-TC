# ADR-002 — Base de datos

**Fecha:** 2026-08  
**Estado:** Recomendado (pendiente de confirmación formal)  
**Responsables de la decisión:** Equipo técnico

---

## Contexto

El sistema maneja un dominio relacional complejo: cotizaciones con múltiples ítems (Composite), órdenes de trabajo con procesos planificados y ejecutados, historial de cambios de precios, secuencias (SEQUENCE) para números correlativos y relaciones entre clientes, piezas y planos.

## Opciones evaluadas

### Opción A: PostgreSQL

Base de datos relacional con soporte nativo para secuencias, restricciones de integridad, transacciones ACID, JSON para datos semiestructurados cuando sea necesario y vistas para reportes.

**Ventajas:**
- Secuencias nativas para el número correlativo de cotización (RN-04): el único enfoque correcto bajo concurrencia.
- Restricciones en la base de datos como segunda línea de defensa para invariantes críticos (precio inmutable después de la adjudicación).
- Soporte sólido para consultas de reportes y estadísticas.
- Ecosistema maduro con Prisma y TypeORM.
- Herramientas estables para migraciones.

**Desventajas:**
- Ninguna relevante para este caso de uso.

### Opción B: MySQL / MariaDB

Similares en capacidades generales, pero con un ecosistema de herramientas algo más limitado en el contexto de Node.js y menor expresividad en secuencias (AUTO_INCREMENT no es equivalente en todos los escenarios).

### Opción C: MongoDB

Base de datos documental. Inadecuada para este dominio: el sistema tiene relaciones fuertes, integridad referencial crítica y necesita secuencias que no existen de forma nativa en MongoDB.

## Decisión

**PostgreSQL**. Es la única opción correcta para este dominio relacional. Las secuencias para el número correlativo y las restricciones para los invariantes de precios no tienen un sustituto adecuado en las otras opciones.

## Notas de implementación

- Usar `CREATE SEQUENCE` para el número de cotización, en lugar de `MAX(id) + 1` en la aplicación.
- Evaluar restricciones de base de datos para bloquear el precio después de la adjudicación.
- Usar migraciones versionadas desde el inicio (Prisma Migrate o Flyway).
