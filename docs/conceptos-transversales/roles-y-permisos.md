# Roles, permisos y confidencialidad

## Asignación de roles

Los roles se asignan al usuario y se combinan cuando tiene varios. El Encargado de Cotización hereda las operaciones del Administrativo Técnico. Todos los roles heredan las operaciones de Usuario. El catálogo cerrado y la baja del usuario vinculada a la del empleado se definen en RN44.

La [Matriz de permisos](../domain/Matriz%20de%20permisos.md) relaciona historias Jira, casos de uso y roles. La [matriz RBAC](../domain/07-matriz-rbac.md) detalla operaciones y campos visibles. Ambas permanecen en `domain/`, junto con sus fuentes y supuestos. La resolución autorizada para CU-55 y CU-56 reserva esas consultas a EC y ER, respectivamente.

## Control de operaciones y datos

La matriz RBAC establece denegación por defecto y control en el backend tanto de las operaciones como de los campos devueltos. Ocultar una opción en la interfaz no reemplaza ese control. Sin sesión válida corresponde `401`; con sesión pero sin un rol permitido, `403`.

El Jefe de Taller consulta operativamente trabajos no facturados (CU-19). Puede ver y registrar precios de materiales, pero no precios hora, costos de procesos, precios pactados, descuentos, señas, márgenes ni desvíos económicos. La exclusión de OTs canceladas de la consulta operativa sigue marcada como supuesto en RN43 y la matriz RBAC.

## Información para el cliente y el taller

RN42 separa precios finales y condiciones comerciales de los costos y datos internos. El PDF al cliente no expone el desglose interno ni el historial. La hoja de ruta impresa se define sin valores monetarios. Las proyecciones exactas por entidad y los supuestos asociados permanecen en [RBAC, §§2–3](../domain/07-matriz-rbac.md).

## Discrepancias y referencias

[ADR-005](../decisions/005-autentication.md) y la [arquitectura](../architecture/overview.md) describen roles y accesos distintos de las matrices del dominio. Se conservan en sus fuentes y se señalan en [DOC-05](../seguimiento/inconsistencias-documentales.md#doc-05--roles-y-accesos-de-adr-005-y-de-la-arquitectura).

Fuentes: [RN42–RN44](../domain/02-reglas-de-negocio.md#g-confidencialidad-y-acceso), [RNF08–RNF10](../domain/03-requerimientos.md), [actores](../domain/04-actores-y-casos-de-uso.md#1-actores) y las dos matrices enlazadas.
