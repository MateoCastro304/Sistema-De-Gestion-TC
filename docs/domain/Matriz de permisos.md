# Matriz de permisos — Castro Tornería

Fuente: historias de usuario del Jira (proyecto **DTC**) y actores de *Casos de Uso V1.1*. Actualizado el 15/10/2026.

## Cómo leerla

- Cada fila es una historia de usuario (un caso de uso). ✅ = el rol puede ejecutarla.
- Un usuario puede tener **varios roles**: sus permisos son la **suma** de las columnas marcadas. Para el API, cada endpoint de una historia exige *al menos uno* de los roles con ✅.
- **EC hereda de AT**: el Encargado de Cotización también puede hacer todo lo del Administrativo Técnico (proveedores, materiales y tipos de proceso), marcado como ✅¹.
- **US (Usuario)** es el actor base: cualquier usuario autenticado, tenga el rol que tenga.
- **Sistema**: lo ejecuta el temporizador, sin usuario. No se expone como endpoint público.

Roles: **ERP** Encargado de Recepción · **EC** Encargado de Cotización · **AT** Administrativo Técnico · **JT** Jefe de Taller · **ER** Encargado de Reportes · **AS** Administrador del Sistema.

## Matriz

| Jira | CU | Historia | US | ERP | EC | AT | JT | ER | AS |
|---|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Sesión** |||||||||
| DTC-33 | 53 | Iniciar sesión | ✅ | | | | | | |
| DTC-32 | 52 | Cerrar sesión | ✅ | | | | | | |
| DTC-214 | 54 | Cambiar contraseña | ✅ | | | | | | |
| **Clientes** |||||||||
| DTC-91 | 01 | Registrar encargado | | ✅ | | | | | |
| DTC-101 | 02 | Modificar encargado | | ✅ | | | | | |
| DTC-100 | 03 | Consultar encargado | | ✅ | | | | | |
| DTC-102 | 04 | Registrar baja de encargado | | ✅ | | | | | |
| DTC-92 | 58 | Registrar fábrica | | ✅ | | | | | |
| DTC-96 | 59 | Modificar fábrica | | ✅ | | | | | |
| DTC-97 | 60 | Consultar fábrica | | ✅ | | | | | |
| DTC-98 | 61 | Registrar baja de fábrica | | ✅ | | | | | |
| DTC-93 | 41 | Registrar rubro | | ✅ | | | | | |
| DTC-103 | 42 | Modificar rubro | | ✅ | | | | | |
| DTC-95 | 43 | Consultar rubro | | ✅ | | | | | |
| DTC-99 | 44 | Registrar baja de rubro | | ✅ | | | | | |
| **Catálogos técnicos** |||||||||
| DTC-107 | 33 | Registrar proveedor | | | ✅¹ | ✅ | | | |
| DTC-110 | 34 | Modificar proveedor | | | ✅¹ | ✅ | | | |
| DTC-108 | 35 | Consultar proveedores | | | ✅¹ | ✅ | | | |
| DTC-109 | 36 | Registrar baja de proveedores | | | ✅¹ | ✅ | | | |
| DTC-116 | 37 | Registrar material | | | ✅¹ | ✅ | | | |
| DTC-117 | 38 | Modificar material | | | ✅¹ | ✅ | | | |
| DTC-118 | 39 | Consultar materiales | | | ✅¹ | ✅ | | | |
| DTC-119 | 40 | Registrar baja de material | | | ✅¹ | ✅ | | | |
| DTC-203 | 09 | Registrar tipo de proceso | | | ✅¹ | ✅ | | | |
| DTC-204 | 10 | Modificar tipo de proceso | | | ✅¹ | ✅ | | | |
| DTC-205 | 11 | Consultar tipo de proceso | | | ✅¹ | ✅ | | | |
| DTC-206 | 12 | Registrar baja de tipo de proceso | | | ✅¹ | ✅ | | | |
| **Cotizaciones** |||||||||
| DTC-2 | 13 | Registrar solicitud de cotización | | ✅ | | | | | |
| DTC-1 | 14 | Registrar cotización | | | ✅ | | | | |
| DTC-3 | 15 | Consultar cotizaciones | | | ✅ | | | | |
| DTC-4 | 16 | Consultar historial de cotizaciones de una pieza | | | ✅ | | | | |
| DTC-5 | 17 | Generar cotización a partir de una anterior | | | ✅ | | | | |
| DTC-6 | 18 | Modificar cotización | | | ✅ | | | | |
| DTC-8 | 20 | Generar informe de cotización | | | ✅ | | | | |
| DTC-9 | 21 | Enviar informe de cotización | | | ✅ | | | | |
| DTC-215 | 55 | Consultar historial de compras a proveedores | | | ✅ | | | | |
| DTC-20 | 22 | Verificar validez de oferta | *Sistema* | | | | | | |
| DTC-10 | 23 | Registrar orden de compra | | ✅ | | | | | |
| **Taller** |||||||||
| DTC-7 | 19 | Consultar órdenes de trabajo | | | | | ✅ | | |
| DTC-11 | 24 | Registrar cancelación de trabajo | | | | | ✅ | | |
| DTC-12 | 25 | Registrar compra de material | | | | | ✅ | | |
| DTC-13 | 26 | Registrar recepción de material | | | | | ✅ | | |
| DTC-14 | 27 | Registrar inicio de construcción | | | | | ✅ | | |
| DTC-21 | 28 | Modificar hoja de ruta | | | | | ✅ | | |
| DTC-16 | 30 | Registrar finalización de trabajo | | | | | ✅ | | |
| DTC-15 | 29 | Validar plazo de entrega | *Sistema* | | | | | | |
| DTC-23 | 31 | Registrar entrega de trabajo | | ✅ | | | | | |
| DTC-24 | 32 | Registrar facturación de trabajo | | ✅ | | | | | |
| **Reportes** |||||||||
| DTC-29 | 49 | Reporte mensual de facturación | | | | | | ✅ | |
| DTC-30 | 50 | Reporte anual de facturación por rubro | | | | | | ✅ | |
| DTC-31 | 51 | Estadísticas de desvíos de cotizaciones | | | | | | ✅ | |
| DTC-216 | 56 | Consultar trabajos realizados | | | | | | ✅ | |
| DTC-217 | 57 | Efectividad de adjudicación de presupuestos | | | | | | ✅ | |
| **Administración** |||||||||
| DTC-28 | 45 | Registrar empleado | | | | | | | ✅ |
| DTC-200 | 46 | Modificar empleado | | | | | | | ✅ |
| DTC-201 | 47 | Consultar empleados | | | | | | | ✅ |
| DTC-202 | 48 | Registrar baja de empleado | | | | | | | ✅ |
| DTC-129 | 05 | Registrar usuario | | | | | | | ✅ |
| DTC-130 | 06 | Modificar usuario | | | | | | | ✅ |
| DTC-131 | 07 | Consultar usuarios | | | | | | | ✅ |
| DTC-132 | 08 | Registrar baja de usuario | | | | | | | ✅ |

## Notas para el API contract

- Sin sesión válida → `401`. Con sesión pero sin ninguno de los roles de la fila → `403`.
- CU-21 usa servicios externos (servidor de correo y de mensajería); el permiso se valida solo para EC.
- En el prototipo, EC ve las solicitudes en **solo lectura** para poder cotizarlas. No es una historia aparte: es la lectura que necesita CU-14. Si el API la expone como endpoint propio (`GET /solicitudes`), habilitar **ERP + EC**.
