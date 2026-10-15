# ADR-001 — Framework del backend

**Fecha:** 2026-08  
**Estado:** Decisión pendiente  
**Responsables de la decisión:** Equipo técnico

---

## Contexto

El sistema requiere un backend Node.js/TypeScript que soporte un dominio rico: dos máquinas de estados, un patrón Composite en los ítems de cotización, RBAC con múltiples roles, generación de PDF delegada a un servicio Python y tareas programadas para el vencimiento de cotizaciones.

## Opciones evaluadas

### Opción A: NestJS

Framework con convenciones definidas y una arquitectura modular por capas para un dominio rico (módulos, controladores, servicios, guards). Incluye soporte nativo para inyección de dependencias, decoradores, RBAC mediante Guards, integración con TypeORM/Prisma y `@nestjs/schedule` para tareas programadas.

**Ventajas:**
- La estructura predefinida reduce las decisiones de arquitectura del equipo.
- Los Guards nativos para RBAC simplifican el control de acceso por roles.
- `@nestjs/schedule` cubre las tareas de vencimiento y demoras sin dependencias adicionales.
- Mayor mantenibilidad a largo plazo cuando cambian los integrantes del equipo.
- Ecosistema maduro con módulos para casi todo lo que necesita el sistema.

**Desventajas:**
- Curva de aprendizaje si el equipo no conoce los decoradores y el sistema de inyección de dependencias.
- Más código repetitivo inicial.

### Opción B: Express manual

Framework minimalista que no impone una estructura. Requiere decidir y construir la arquitectura desde cero (rutas, middleware, inyección de dependencias, guards, etc.).

**Ventajas:**
- Control completo sobre cada capa.
- Menor abstracción = depuración más sencilla para desarrolladores experimentados.

**Desventajas:**
- Sin una estructura impuesta, los proyectos de este tamaño tienden a presentar diferencias de calidad entre módulos.
- Todo lo que NestJS ya proporciona debe construirse manualmente: guards de RBAC, inyección de dependencias y planificador de tareas.
- Más tiempo de configuración inicial sin valor para el negocio.

## Recomendación provisional

**NestJS**, dado el tamaño del equipo y la complejidad del dominio. La estructura impuesta es una ventaja, y no un costo, cuando varios módulos deben crecer en paralelo.

## Decisión

La decisión final es adoptar **NestJS** como framework del backend.
