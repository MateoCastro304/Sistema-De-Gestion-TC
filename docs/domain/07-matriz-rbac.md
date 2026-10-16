# 07 · Matriz de control de acceso por rol (RBAC)

> Fuente: actores de los CU (Casos de Uso V1.1), RN42, RN43, RN44, RNF09 y decisiones `🔁 D-01` y `🔁 D-03`.
>
> **Principios**
> 1. **Denegar por defecto:** un rol solo hace lo que esta matriz le permite.
> 2. **Un usuario puede tener varios roles** (RN44); sus permisos son la **unión** de los de cada rol.
> 3. **El EC hereda del AT** (tiene todos los permisos del AT).
> 4. **Todo rol hereda de Usuario** (CU-52, 53, 54).
> 5. **El control se hace en el backend**, sobre la operación **y sobre los campos de la respuesta** (RNF09). La UI solo refleja lo que la API ya filtró.

Roles: `JT` Jefe de Taller · `ERP` Encargado de Recepción · `ER` Encargado de Reportes · `EC` Encargado de Cotización · `AT` Administrativo Técnico · `AS` Administrador del Sistema.

Para CU-55 y CU-56 rige la asignación de la [Matriz de permisos](Matriz%20de%20permisos.md): CU-55 corresponde únicamente a EC y CU-56 únicamente a ER.

Leyenda: ✅ permitido · ⛔ denegado · 👁 solo lectura · 🔒 lectura **sin datos económicos** (ver §2).

---

## 1. Matriz de operaciones (por caso de uso)

| CU | Operación | JT | ERP | ER | EC | AT | AS |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| 52–54 | Iniciar y cerrar sesión, cambiar contraseña propia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 01–04 | ABMC Cliente (encargado) | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| 58–61 | ABMC Fábrica | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| 41–44 | ABMC Rubro | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| 05–08 | ABMC Usuario y asignación de roles | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| 45–48 | ABMC Empleado | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| 09–12 | ABMC Tipo de Proceso (precio hora) | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ⛔ |
| 33–36 | ABMC Proveedor | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ⛔ |
| 37–40 | ABMC Material | ⛔ | ⛔ | ⛔ | ✅ | ✅ | ⛔ |
| 55 | Historial de compras a proveedores | ⛔ | ⛔ | ⛔ | 👁 | ⛔ | ⛔ |
| 13 | Registrar Solicitud de Cotización | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| 14 | Registrar Cotización (incl. borrador) | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| 15 | Consultar Cotizaciones | ⛔ | ⛔ | ⛔ | 👁 | ⛔ | ⛔ |
| 16 | Historial de cotizaciones de una pieza | ⛔ | ⛔ | ⛔ | 👁 | ⛔ | ⛔ |
| 17 | Cotizar a partir de una anterior | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| 18 | Modificar Cotización | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| 20 | Generar Informe de Cotización | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| 21 | Enviar Informe de Cotización | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| 23 | Registrar Orden de Compra (adjudicar) | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| 19 | Consultar OTs (operativa: **no facturadas**) | 🔒 | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| 24 | Registrar Cancelación de Trabajo | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| 25 | Registrar Compra de Material (**con precios de material**) | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| 26 | Registrar Recepción de Material | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| 27 | Registrar Inicio de Construcción (genera hoja de ruta) | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| 28 | Modificar Hoja de Ruta | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| 30 | Registrar Finalización (hoja de ruta real) | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| 31 | Registrar Entrega (nº de remito) | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| 32 | Registrar Facturación (nº de factura) | ⛔ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| 56 | Consultar Trabajos Realizados (historial de OTs) | ⛔ | ⛔ | 👁 | ⛔ | ⛔ | ⛔ |
| 49 | Reporte mensual de facturación | ⛔ | ⛔ | 👁 | ⛔ | ⛔ | ⛔ |
| 50 | Reporte anual de facturación por rubro | ⛔ | ⛔ | 👁 | ⛔ | ⛔ | ⛔ |
| 51 | Estadísticas de desvíos | ⛔ | ⛔ | 👁 | ⛔ | ⛔ | ⛔ |
| 57 | Efectividad de adjudicación | ⛔ | ⛔ | 👁 | ⛔ | ⛔ | ⛔ |
| — | Ver o descargar planos y diseños 3D | ✅ | ✅ | ⛔ | ✅ | ⛔ | ⛔ |
| — | Administrar credenciales de correo y WhatsApp (RNF21) | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| — | Administrar parámetros: dólar, validez, % seña y descuento (RNF15) | ⛔ | ⛔ | ⛔ | ✅ | ⛔ | ⛔ |
| — | Modificar o eliminar registros de auditoría | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| — | Modificar `precioPactado` de una OT | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |

`⚠️ SUPUESTO` Las filas marcadas con "—" (sin CU) las derivó el analista de RNF09, RNF10, RNF15, RNF21 y RN34. En particular, el acceso a planos se otorgó a quien los necesita para trabajar (ERP los carga, EC cotiza, JT fabrica), y los parámetros económicos al EC. Validar con el cliente.

`⚠️ SUPUESTO` Los roles distintos de JT no tienen un CU de consulta de OTs; ERP necesita al menos ver las OTs `Finalizado` y `Entregado` para registrar remito y factura. Se asume que CU-31 y CU-32 incluyen una búsqueda de la OT con los datos necesarios.

---

## 2. Visibilidad de datos del Jefe de Taller `🔁 D-01` `🔁 D-03`

Regla (RN43): **del dinero, el JT solo ve y registra precios de materiales.**

### 2.1 Qué OTs ve

| Vista | Alcance |
|---|---|
| Consulta operativa (CU-19) | OTs con `estado ≠ Facturado`. `⚠️ SUPUESTO` También se excluye `Cancelado`. |

### 2.2 Campos por entidad

| Entidad | Campos **visibles** para JT | Campos **prohibidos** para JT (no deben viajar en la respuesta) |
|---|---|---|
| `OrdenDeTrabajo` | estado, estaDemorado, observaciones, motivoCancelacion, fecha de entrega pactada, cantidad de piezas, descripción | **precioPactado** |
| `ItemCotizacion` | descripción, cantidad, tipoItem, plazoEntrega, piezasHijas (estructura) | precioUnitario, subtotal, condicionPago, descuentoItem |
| `Cotizacion` | nroCotizacion, fábrica/cliente (nombre) | precioFinal, porcSeña, descuentoGeneral, precioDolar, moneda |
| `Pieza` | idPieza (nº de plano), descripción, plano, foto de pieza patrón, 3D | — |
| `CompraDeMaterial` (cotizado y comprado) | material, calidad, presentación, unidadMedida, cantidadMaterial, **precioXUnidad**, proveedor | — |
| `ProcesoPropio` | orden, descripción, tipo de proceso (nombre), cantHorasEstimadas | **precioHora**, costo estimado |
| `ProcesoTercerizado` | orden, descripción, proveedor | **costoTotalServicio** |
| `Pintado` | orden, descripción, cantidadLitros, cantHorasEstimadas, proveedor | **costoXLitro**, **precioHora**, costo estimado |
| `EjecucionPropio` | responsable, cantHorasReales, observaciones | **precioHoraReal**, costo real, desvío económico |
| `EjecucionTercerizado` | proveedor real, observaciones | **costoRealServicio**, desvío económico |
| `EjecucionPintado` | cantHorasReales, cantidadLitrosReal, proveedor real, observaciones | **costoPorLitroReal**, **precioHoraReal**, desvío económico |
| `Repuesto` | nombre, descripción, cantidad, proveedor | **precio**, costo total |
| `TipoProceso` | nombre, descripción | **precioHoraBasePesos**, **precioHoraBaseUSD** |
| `Remito` / `Factura` | número, fecha | **Factura.montoFinal** |
| Desvíos | Desvíos físicos: horas reales vs. estimadas y cantidad de material real vs. cotizada. `⚠️ SUPUESTO` | Desvíos en dinero |

> **Hoja de ruta impresa (RNF04):** usa la misma proyección de campos que el JT, sin ningún valor monetario.

---

## 3. Separación cliente / interno (RN42)

| Destino | Datos permitidos |
|---|---|
| **Informe al cliente (CU-20, PDF)** | Por ítem: descripción, nº de plano, cantidad, precio unitario final, precio total. Además: plazo de entrega, condición de pago, validez de la oferta, observaciones, precio final total y, si corresponde, seña. |
| **Prohibido en el informe** | Costos de material, mano de obra, tercerizados y repuestos; precios hora; márgenes; horas reales; desvíos; historial de cambios. |

`⚠️ SUPUESTO` La seña se incluye en el informe por ser una condición comercial que el cliente debe conocer (RN27); la ERS no la lista explícitamente en RN30.

---

## 4. Verificación

Por cada fila de la §1 y cada entidad de la §2.2 debe existir un **test de integración** que:
1. Autentique con el rol.
2. Llame a la operación.
3. Verifique el código HTTP esperado (200/201 o 403).
4. Para 🔒, **verifique que las claves prohibidas no existan en el JSON de respuesta**, no solo que la UI no las muestre.
