# ADR-013 — Arquitectura interna del backend: monolito modular con hexágono por subsistema

**Fecha:** 2026-10  
**Estado:** Propuesta (el código de `customers` y `supplier` ya sigue esta forma; falta la aprobación del equipo)  
**Responsables de la decisión:** Equipo técnico

---

## Contexto y problema

[ADR-001](001-backend-framework.md) elige NestJS y [ADR-003](003-orm.md) elige Prisma. Ninguno de los dos dice cómo se organiza el código por dentro: qué es un módulo, dónde viven las reglas del negocio y qué puede depender de qué.

El dominio tiene lógica que conviene aislar de la base de datos y de HTTP:

- **Dos máquinas de estado:** cotización y orden de trabajo, con transiciones ilegales que se deben rechazar ([06](../dominio/06-maquinas-de-estado.md)).
- **Un Composite de ítems:** conjuntos y reparaciones de cualquier profundidad (RN11).
- **Cálculos polimórficos:** el costo estimado de cada tipo de proceso planificado y el desvío de cada ejecución (RN17 a RN22, RN40).
- **Precio pactado inmutable** (RN34) y numeración correlativa (RN04).
- **RBAC con proyección de campos:** el taller no ve importes ([07](../dominio/07-matriz-rbac.md)).

Varios integrantes desarrollan áreas distintas en paralelo. Sin fronteras explícitas, el código de un área termina leyendo y escribiendo las tablas de otra.

El código de los Sprints 1 y 2 ya se organizó así: `backend/src/subsystems/<x>/{core,infrastructure}`, con reglas de capas en `backend/eslint.config.mjs`. Pero la decisión no estaba registrada, y [CLAUDE.md](../../.claude/CLAUDE.md) todavía describe módulos de controller más service.

## Alternativas consideradas

- **Arquitectura en capas clásica** (controller, service, repositorio de Prisma): es la que describía la documentación inicial. Tiene dos problemas:
  - Las reglas quedan acopladas a Prisma, y para probar un cálculo de costo o una transición de estado hay que levantar una base de datos.
  - Las capas no imponen fronteras verticales: nada impide que el código de reportes escriba en las tablas de cotizaciones.
- **Un único hexágono para todo el sistema:** aísla el dominio de la infraestructura, pero no resuelve las fronteras internas. Una sola carpeta `domain/entities/` con las clases de seis áreas no dice qué pertenece a qué.
- **Microservicios:** requieren varios procesos desplegables, red entre ellos y consistencia distribuida. [ADR-009](009-deploy-infrastructure.md) ya descarta Kubernetes y la [visión general](../arquitectura/overview.md#principios-y-restricciones) pide no sobrediseñar para esta escala.

## Decisión

Se adopta un **monolito modular**: un único proceso desplegable, dividido en **subsistemas**. Cada subsistema implementa una **arquitectura hexagonal** (puertos y adaptadores) con dos partes:

- **`core`:** el dominio y la aplicación. No conoce NestJS, Prisma ni HTTP, salvo una excepción: los casos de uso llevan el decorador `@Injectable()`.
- **`infrastructure`:** los adaptadores de entrada y de salida, y el módulo NestJS que los conecta.

Los subsistemas que existen están definidos en [ADR-014](014-subsistemas.md).

Reglas centrales:

1. **Las dependencias apuntan hacia adentro.** `domain` no importa nada de otras capas; `application` importa solo de `domain`; `infrastructure` importa de `core`.
2. **Ningún subsistema importa el `core` de otro.** Se comunican de forma síncrona. El subsistema que necesita algo declara un puerto con su propio vocabulario, y lo implementa un adaptador anticorrupción que invoca un caso de uso exportado por el otro subsistema.
3. **Dentro de un subsistema**, entidades y casos de uso se usan directamente, sin puertos.
4. **Los puertos son clases abstractas.** Sirven a la vez como tipo de TypeScript y como token de inyección de NestJS, así que no hace falta `Symbol` ni `@Inject`.
5. **Cada subsistema escribe solo en sus tablas.** Puede tener claves foráneas hacia tablas de otros subsistemas.
6. **`reporting` es la única excepción:** consulta la base directamente, en modo de solo lectura.

Las reglas de detalle (entidades, casos de uso, errores, transacciones, reloj, nombres) están en la [arquitectura del backend](../arquitectura/backend.md).

## Consecuencias

**Lo que se gana:**

- Las reglas del negocio se prueban con tests unitarios, sin base de datos ni HTTP.
- Las fronteras entre subsistemas se ven en el *pull request*: un import del `core` de otro subsistema salta a la vista.
- Prisma, S3, el servicio de PDF y los proveedores de correo y WhatsApp son detalles reemplazables. Cambiar uno implica cambiar su adaptador, no los casos de uso.

**Lo que se paga:**

- Un ABMC simple pasa de dos archivos a cinco o siete: entidad, puerto, caso de uso, controller, DTO, repositorio y mapper.
- El mismo dato tiene tres representaciones (dominio, modelo de Prisma y DTO de HTTP) y hay que mapear entre ellas.
- Exige disciplina sostenida. Un solo import de infraestructura dentro del dominio vuelve a convertir la arquitectura en capas.

## Referencias y pendientes

- [Arquitectura del backend](../arquitectura/backend.md): anatomía, comunicación, modelo de errores y desvíos del código actual.
- [ADR-014](014-subsistemas.md): mapa de subsistemas.
- Decisiones abiertas DA-01 a DA-08 en la [arquitectura del backend](../arquitectura/backend.md#decisiones-pendientes).
- Toma como base la arquitectura de backend de VZ Causas, que usa la misma estructura con NestJS. Se adaptó a este dominio: puertos como clases abstractas, comunicación directa dentro de un subsistema y subsistemas definidos a partir de las funcionalidades.
