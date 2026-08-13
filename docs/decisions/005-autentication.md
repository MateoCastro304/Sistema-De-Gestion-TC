# ADR-005 — Autenticación y Autorización

**Fecha:** 2026-08  
**Estado:** Pendiente de decisión  
**Decisores:** Equipo técnico

---

## Contexto

El sistema tiene 7 roles con diferentes permisos, incluyendo una separación crítica entre personal administrativo (acceso a costos) y personal de taller (solo tiempos de proceso). La autenticación debe ser segura, simple de operar, y adecuada para una aplicación de uso interno.

## Opciones evaluadas

### Opción A: JWT (JSON Web Tokens)

Tokens firmados que contienen el payload del usuario (id, rol) y se verifican sin consultar la base de datos.

**A favor:**
- Sin estado en servidor: escala horizontalmente sin sesiones compartidas.
- Integración directa con NestJS Guards para RBAC.
- Estándar conocido por la mayoría de los devs.
- Ideal si en el futuro se agrega una app móvil o se expone la API a terceros.

**En contra:**
- Sin mecanismo nativo de revocación antes del vencimiento. Si un usuario es deshabilitado, su token sigue siendo válido hasta que expire.
- Requiere manejo explícito del refresh token para sesiones largas.
- El payload del token viaja en cada request: no guardar datos sensibles (márgenes, costos) en el token.

**Mitigación de revocación:** una blocklist de tokens revocados en memoria o Redis (aunque se decidió no usar Redis, una lista en PostgreSQL con TTL puede ser suficiente para este volumen).

### Opción B: Sessions (express-session / @nestjs/session)

El servidor mantiene el estado de sesión en memoria o en base de datos. El cliente recibe solo un session ID.

**A favor:**
- Revocación inmediata: borrar la sesión del servidor = usuario deslogueado.
- Más simple de razonar sobre el estado de autenticación.

**En contra:**
- Stateful: para escalar horizontalmente se necesita un store compartido (Redis u otro).
- Menos portable si en el futuro se agrega una API pública o una app móvil.

## Modelo de autorización (RBAC)

Independientemente del mecanismo de autenticación elegido, el sistema usa **RBAC basado en roles** (no permisos granulares). Cada endpoint declara qué roles tienen acceso.

| Módulo | Roles con acceso |
|--------|-----------------|
| Cotizaciones (lectura + creación) | EC, AT, AS, A |
| Cotizaciones (costos internos) | EC, AT, AS |
| Órdenes de Trabajo (lectura) | JT, EC, ERP, AT, AS |
| Órdenes de Trabajo (registrar procesos/tiempos) | JT, AT, AS |
| Reportes | ER, AT, AS |
| Configuración del sistema | AS |
| Gestión de usuarios | AS |

La separación crítica es que **JT nunca accede a datos económicos**. Esto debe validarse tanto en el backend (Guard) como en el frontend (ocultar la UI).

## Recomendación provisional

**JWT** con refresh tokens y una tabla de tokens revocados en PostgreSQL para las sesiones terminadas anticipadamente. Es la opción más portable y estándar para este tipo de aplicación.

## Pendiente para cerrar esta decisión

- [ ] Confirmar si el sistema tendrá app móvil en el futuro (refuerza JWT).
- [ ] Definir el tiempo de vida de los access tokens (recomendado: 15 minutos) y refresh tokens (recomendado: 7 días).
- [ ] Definir si se requiere soporte para múltiples sesiones simultáneas por usuario.
