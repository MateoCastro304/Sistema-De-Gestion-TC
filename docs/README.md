# Documentación de Tornería Castro SRL

Este índice reúne la documentación del negocio, las referencias técnicas y las guías de trabajo. Para entender el sistema, empezá por la [visión general](vision-general.md); para preparar el entorno, por [SETUP.md](SETUP.md).

## Organización

| Ubicación | Contenido |
| --- | --- |
| [vision-general.md](vision-general.md) | Punto de partida: propósito, alcance, actores, áreas funcionales y recorrido general del sistema. |
| [glosario.md](glosario.md) | Definiciones compartidas del negocio. |
| [funcionalidades/](funcionalidades/) | Explicación de cada área funcional, con enlaces a sus reglas, casos de uso y estados en `domain/`: [clientes, fábricas y rubros](funcionalidades/clientes.md), [usuarios y empleados](funcionalidades/usuarios-y-empleados.md), [catálogos técnicos](funcionalidades/catalogos-tecnicos.md), [solicitudes y cotizaciones](funcionalidades/cotizaciones.md), [órdenes de trabajo](funcionalidades/ordenes-de-trabajo.md) y [reportes](funcionalidades/reportes.md). |
| [conceptos-transversales/](conceptos-transversales/) | Conceptos compartidos entre áreas: [roles, permisos y confidencialidad](conceptos-transversales/roles-y-permisos.md). |
| [architecture/](architecture/) | Arquitectura del sistema. Documento actual: [visión general de arquitectura](architecture/overview.md). |
| [openapi/](openapi/) | Contratos de la API. Punto de entrada: [openapi.yaml](openapi/openapi.yaml). |
| [api-contract/](api-contract/) | [Referencia de API del Sprint 2](api-contract/API_CONTRACT_SPRINT_2.md): endpoints, convenciones y puntos abiertos. |
| [database/](database/) | Procedimiento de [migraciones con Prisma](database/Migrations.md). |
| [testing/](testing/) | [Organización de pruebas](testing/code-structure.md) y [casos de prueba y trazabilidad](testing/test-cases-structure.md). |
| [prototipo/](prototipo/) | Prototipos y recursos de interfaz. El [contexto del prototipo](prototipo/fuente/CONTEXTO.md) describe su contenido, funcionamiento y limitaciones. |
| [decisions/](decisions/) | Registros ADR-001 a ADR-010. Consultar el estado de cada decisión en su documento. |
| [domain/](domain/) | Requisitos, reglas, casos de uso, modelo, estados y permisos. Punto de entrada: [índice y convenciones](domain/00-indice-y-convenciones.md). |
| [seguimiento/](seguimiento/) | [Pendientes actuales](seguimiento/pendientes-actuales.md), con identificadores, prioridades y estados; [backlog de ingeniería](seguimiento/engineering-backlog.md) (infraestructura, CI/CD, herramientas y calidad de código); [inconsistencias documentales](seguimiento/inconsistencias-documentales.md) entre documentos, pendientes de resolver. |
| [rubros-desvios-contrato.md](rubros-desvios-contrato.md) | Diferencias registradas entre el contrato y el backend de Rubros, y su efecto en el frontend. |
| [plantillas/](plantillas/) | Guías para [funcionalidades](plantillas/funcionalidad.md), [visión general](plantillas/vision-general.md), [ADR](plantillas/adr.md), [arquitectura](plantillas/arquitectura.md) y [flujos de acciones](plantillas/flujo-de-acciones.md). |
| [SETUP.md](SETUP.md) | Preparación y ejecución del entorno. |
| [CONTRIBUTING.MD](CONTRIBUTING.MD) | Convenciones y proceso de colaboración del equipo. |

## Estado de la reorganización

Cada documento usa solo los apartados de las [plantillas](plantillas/) que aportan a su propósito, conservando el contenido sustantivo, los identificadores y los estados documentados. Las especificaciones formales (reglas, requisitos, casos de uso, estados y matrices) permanecen en `domain/`; los documentos de `funcionalidades/` y `conceptos-transversales/` las explican y enlazan sin duplicarlas.

Las contradicciones detectadas entre documentos no se resolvieron: están registradas en [inconsistencias documentales](seguimiento/inconsistencias-documentales.md), incluidos los archivos citados que no existen en el repositorio.

El contexto, el propósito y los usuarios del sistema se trasladaron de `domain/01-introduccion-alcance.md` a la [visión general](vision-general.md), y el glosario del dominio al [glosario](glosario.md); el archivo de origen conserva remisiones en las mismas secciones.
