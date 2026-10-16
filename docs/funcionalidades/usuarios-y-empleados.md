# Usuarios y empleados

## Propósito y responsabilidades

Administrar el personal y las cuentas que permiten acceder al sistema (RF02 y RF04). El Administrador del Sistema (AS) gestiona empleados, usuarios y asignación de roles. Todo usuario puede iniciar y cerrar su sesión y cambiar su contraseña mediante CU-52–CU-54.

## Conceptos, relaciones y reglas

El empleado representa al personal; el usuario es su cuenta de acceso. El rol pertenece al usuario, no al empleado. Los roles constituyen un catálogo cerrado: JT, ERP, ER, EC, AT y AS. Un usuario puede tener uno o varios roles, y sus permisos se combinan.

Al dar de baja lógica a un empleado, el sistema desactiva automáticamente su usuario si lo tiene (RN44). La relación entre usuario, empleado, rol y sesión se describe en el [modelo de dominio, §2.6](../dominio/05-modelo-de-dominio.md#26-proveedores-personal-y-acceso).

## Funcionamiento

CU-45–CU-48 cubren el registro, modificación, consulta y baja de empleados; CU-05–CU-08 cubren las cuentas. El acceso a las operaciones y a los datos se evalúa según los roles de la sesión. La administración de una cuenta no concede por sí misma permisos de otros roles.

Los requisitos de autenticación y sesión permanecen en RNF08 y los de confidencialidad en RNF09. Los detalles técnicos del Sprint 2 se consultan en la [referencia de API](../api-contract/API_CONTRACT_SPRINT_2.md).

## Decisiones y límites

[ADR-005](../decisiones/005-autentication.md) describe JWT, renovación y revocación, con estado «Decisión pendiente». Su tabla de autorización difiere de las matrices de dominio y menciona siete roles; la discrepancia está registrada en [DOC-05](../seguimiento/inconsistencias-documentales.md#doc-05--roles-y-accesos-de-adr-005-y-de-la-arquitectura), sin cambiar su estado.

Fuentes: [RF02, RF04, RNF08 y RNF09](../dominio/03-requerimientos.md), [RN44](../dominio/02-reglas-de-negocio.md), [casos de uso, §2.2](../dominio/04-actores-y-casos-de-uso.md#22-usuarios-empleados-y-sesión--rf02-rf04) y [roles y permisos](../conceptos-transversales/roles-y-permisos.md).
