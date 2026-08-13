# ADR-001 — Framework de Backend

**Fecha:** 2026-08  
**Estado:** Pendiente de decisión  
**Decisores:** Equipo técnico

---

## Contexto

El sistema requiere un backend en Node.js/TypeScript que soporte un dominio rico: dos máquinas de estado, patrón Composite en ítems de cotización, RBAC con múltiples roles, generación de PDFs delegada a un servicio Python, y jobs programados para vencimiento de cotizaciones.

## Opciones evaluadas

### Opción A: NestJS

Framework opinionado con arquitectura modular (módulos, controladores, servicios, guards). Incluye soporte nativo para inyección de dependencias, decoradores, RBAC con Guards, integración con TypeORM/Prisma, y `@nestjs/schedule` para jobs.

**A favor:**
- Estructura predefinida reduce decisiones de arquitectura para el equipo.
- Guards nativos para RBAC simplifican el control de acceso por rol.
- `@nestjs/schedule` cubre los jobs de vencimiento y demoras sin dependencias adicionales.
- Mejor mantenibilidad a largo plazo cuando el equipo rota.
- Ecosistema maduro con módulos para casi todo lo que necesita el sistema.

**En contra:**
- Curva de aprendizaje si el equipo no conoce los decoradores y el sistema DI.
- Mayor boilerplate inicial.

### Opción B: Express manual

Framework minimalista sin estructura impuesta. Requiere decidir y construir la arquitectura desde cero (routing, middleware, DI, guards, etc.).

**A favor:**
- Más control total sobre cada capa.
- Menos abstracción = más fácil de debuggear para devs experimentados.

**En contra:**
- Sin estructura impuesta, proyectos de este tamaño tienden a divergir en calidad entre módulos.
- Hay que construir manualmente lo que NestJS ya trae: guards de RBAC, inyección de dependencias, scheduler.
- Más tiempo inicial de setup sin valor de negocio.

## Recomendación provisional

**NestJS**, dado el tamaño del equipo y la complejidad del dominio. La estructura impuesta es una ventaja, no un costo, cuando hay múltiples módulos que deben crecer en paralelo.

## Pendiente para cerrar esta decisión

- [ ] Confirmar nivel real de TypeScript del equipo.
- [ ] Confirmar si algún miembro ya tiene experiencia con NestJS.
