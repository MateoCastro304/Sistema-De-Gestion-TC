# ADR-005 — Autenticación y autorización

**Fecha:** 2026-08  
**Estado:** Decisión pendiente  
**Responsables de la decisión:** Equipo técnico

---

## Contexto y problema

El sistema tiene 7 roles con distintos permisos, incluida una separación crítica entre el personal administrativo (acceso a costos) y el personal de taller (solo tiempos de procesos). La autenticación debe ser segura, sencilla de operar y adecuada para una aplicación de uso interno.

## Alternativas consideradas

### Opción A: JWT (JSON Web Tokens)

Tokens firmados que contienen los datos del usuario (id, rol) y se verifican sin consultar la base de datos.

**Ventajas:**
- Sin estado en el servidor: escala horizontalmente sin sesiones compartidas.
- Integración directa con Guards de NestJS para RBAC.
- Estándar conocido por la mayoría de los desarrolladores.
- Ideal si en el futuro se agrega una aplicación móvil o se expone la API a terceros.

**Desventajas:**
- Sin mecanismo nativo de revocación antes del vencimiento. Si se deshabilita un usuario, su token sigue siendo válido hasta que vence.
- Requiere manejo explícito del token de renovación para sesiones largas.
- Los datos del token viajan en cada solicitud: no almacenar información sensible (márgenes, costos) en él.

**Mitigación de revocación:** una lista de tokens revocados en memoria o Redis (aunque se decidió no usar Redis, una tabla en PostgreSQL con TTL puede ser suficiente para este volumen).

### Opción B: Sesiones (express-session / @nestjs/session)

El servidor mantiene el estado de la sesión en memoria o en la base de datos. El cliente recibe únicamente un ID de sesión.

**Ventajas:**
- Revocación inmediata: eliminar la sesión del servidor = usuario desconectado.
- Más sencillo razonar sobre el estado de autenticación.

**Desventajas:**
- Con estado: el escalado horizontal requiere un almacenamiento compartido (Redis u otro).
- Menos portable si en el futuro se agrega una API pública o una aplicación móvil.

## Decisión

> Estado registrado: **Decisión pendiente**. El texto formula la elección, pero no implica aprobación formal; ver [inconsistencias documentales](../seguimiento/inconsistencias-documentales.md#estados-de-los-adr).

**JWT** con tokens de renovación y una tabla de tokens revocados en PostgreSQL para sesiones finalizadas antes de tiempo. Es la opción más portable y estándar para este tipo de aplicación.

Para la autorización, se implementará **RBAC basado en roles** con Guards en NestJS.

### Modelo de autorización (RBAC)

Independientemente del mecanismo de autenticación elegido, el sistema usa **RBAC basado en roles** (no permisos granulares). Cada endpoint declara qué roles tienen acceso.

| Módulo | Roles con acceso |
|--------|-----------------|
| Cotizaciones (lectura + creación) | EC, AT, AS, A |
| Cotizaciones (costos internos) | EC, AT, AS |
| Órdenes de trabajo (lectura) | JT, EC, ERP, AT, AS |
| Órdenes de trabajo (registro de procesos/tiempos) | JT, AT, AS |
| Reportes | ER, AT, AS |
| Configuración del sistema | AS |
| Gestión de usuarios | AS |

La separación crítica es que **JT nunca accede a datos financieros**. Esto debe validarse tanto en el backend (Guard) como en el frontend (ocultando la interfaz).
