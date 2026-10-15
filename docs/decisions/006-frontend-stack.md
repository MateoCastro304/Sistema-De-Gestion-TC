# ADR-006 — Tecnologías del frontend

**Fecha:** 2026-08  
**Estado:** Decisión pendiente  
**Responsables de la decisión:** Equipo técnico

---

## Contexto

El sistema requiere una interfaz web de uso interno con las secciones descritas en la [visión general de arquitectura](../architecture/overview.md): panel principal, cotizaciones, órdenes de trabajo, clientes, piezas, reportes y configuración. Es una aplicación con uso intensivo de formularios y tablas, no un sitio de contenidos. Todas las pantallas requieren autenticación, por lo que no hay requisitos de SEO.

Dos restricciones orientan la decisión. Primero, el backend está en TypeScript (NestJS, ver ADR-001-backend-framework.md), por lo que elegir el mismo lenguaje en el cliente permite compartir los tipos del contrato de la API. Segundo, la interfaz debe reflejar el RBAC definido en ADR-005-autentication.md: el rol JT no debe ver costos ni márgenes, ocultos en el frontend y restringidos en el backend.

## Opciones evaluadas

### Opción A: React + TypeScript

Biblioteca de componentes con el ecosistema más grande del ámbito frontend, empaquetada con Vite y compilada a archivos estáticos.

**Ventajas:**
- Mismo lenguaje que el backend: los tipos pueden generarse desde el contrato de la API, de modo que un cambio produce un error de compilación en lugar de fallar durante la ejecución.
- El ecosistema y la disponibilidad de desarrolladores más grandes, algo relevante cuando cambian los integrantes del equipo.
- El renderizado condicional por rol es JavaScript simple: la interfaz basada en RBAC se mantiene legible y fácil de auditar.
- La compilación produce archivos estáticos servidos directamente por Nginx, sin un proceso adicional en el despliegue definido en ADR-009-deploy-infrastructure.md.
- Los componentes recursivos se adaptan naturalmente a los ítems anidados del constructor de cotizaciones.

**Desventajas:**
- Es una biblioteca, no un framework: las rutas, el estado del servidor y los formularios requieren bibliotecas externas.
- No impone una estructura de proyecto, por lo que las convenciones deben exigirse mediante ESLint y revisión de código.

### Opción B: Angular + TypeScript

Framework completo, centrado en TypeScript, con rutas, cliente HTTP y formularios incluidos.

**Ventajas:**
- Estructura impuesta y enfoque basado en decoradores e inyección de dependencias similar a NestJS.
- Reactive Forms se adapta bien a formularios con muchas validaciones, como el constructor de cotizaciones.

**Desventajas:**
- Curva de aprendizaje más pronunciada: se deben comprender los módulos, RxJS y la detección de cambios antes de ser productivo.
- RxJS es obligatorio para la mayoría de los flujos asíncronos, un costo significativo para un equipo que no lo usa.
- Ecosistema y disponibilidad de desarrolladores menores que los de React.

### Opción C: Next.js

React con renderizado del lado del servidor y rutas de API. Se rechaza sin mayor análisis: SSR no aporta beneficios a una aplicación completamente protegida por autenticación, agrega un entorno de ejecución Node.js a producción y sus rutas de API se superponen con el backend NestJS existente.

## Bibliotecas complementarias

React no cubre las rutas, el estado del servidor ni los formularios. Las tecnologías se completan con **Vite** (compilación), **React Router** (rutas y protección de rutas por rol), **TanStack Query** (estado del servidor y caché), **React Hook Form + Zod** (formularios y validación) y **Axios** (cliente HTTP con interceptores para JWT).

No se adopta un almacén global de estado (Redux, Zustand): la mayor parte del estado proviene del servidor y ya está cubierta por TanStack Query.

## Recomendación provisional

**React + TypeScript**, por la continuidad de lenguaje con el backend y por el tamaño de su ecosistema, que reduce el costo de incorporación cuando cambian los integrantes del equipo.

## Decisión

La decisión final es adoptar **React con TypeScript** como tecnologías del frontend, compilado con Vite y servido como archivos estáticos. Las desventajas —la necesidad de bibliotecas externas y la ausencia de una estructura impuesta— se consideran manejables con una estructura de carpetas y reglas de análisis estático acordadas.
