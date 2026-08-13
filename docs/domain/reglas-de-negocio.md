# Reglas de Negocio — Tornería Castro SRL

Este documento lista las reglas de negocio críticas del sistema. Son **invariantes**: el código debe respetarlas siempre, independientemente del flujo o rol. Cualquier cambio a estas reglas requiere validación explícita con el cliente.

---

## RN-01 — Invariabilidad del precio post-adjudicación

**Regla:** Una vez que el cliente emite una Orden de Compra y la cotización pasa a estado `Adjudicado` o `AdjudicadoParcial`, el precio de venta al cliente **no puede modificarse bajo ninguna circunstancia**, aunque cambien los costos internos de materiales o mano de obra.

**Alcance:** Aplica al precio total y a los precios por ítem de la cotización.

**Implicación técnica:** El sistema debe almacenar un snapshot inmutable del precio en el momento de la adjudicación. Las tablas de cotización deben distinguir claramente el historial pre-adjudicación (modificable) del post-adjudicación (de solo lectura para el precio).

---

## RN-02 — Historial de modificaciones

**Regla:** Las modificaciones a una cotización se comportan distinto según su estado:

- **Pre-adjudicación**: las modificaciones son libres. Se pueden cambiar ítems, precios y condiciones.
- **Post-adjudicación**: se puede agregar información operativa (avance de producción, tiempos reales) pero el precio queda bloqueado.

**Implicación técnica:** El sistema debe registrar un historial de cambios. El momento de la adjudicación es el punto de no retorno para los datos económicos.

---

## RN-03 — Generación de Orden de Trabajo por ítem adjudicado

**Regla:** Cuando una cotización es adjudicada (total o parcialmente), el sistema genera automáticamente **una Orden de Trabajo por cada ítem adjudicado**.

**Caso parcial:** Si solo algunos ítems de una cotización son adjudicados, solo se generan OTs para esos ítems. El resto de la cotización puede quedar en estado `AdjudicadoParcial`.

---

## RN-04 — Número correlativo de presupuesto

**Regla:** Cada cotización recibe un número correlativo único e irrepetible, generado de forma secuencial.

**Implicación técnica:** El número debe generarse usando una `SEQUENCE` de PostgreSQL para garantizar unicidad incluso bajo concurrencia. No puede calcularse en la capa de aplicación.

---

## RN-05 — Actualización de precio por variación del dólar

**Regla:** Los precios de cotizaciones antiguas pueden actualizarse usando la fórmula:

```
precio_nuevo = precio_anterior / dolar_anterior * dolar_actual
```

Esta actualización aplica únicamente a cotizaciones en estado pre-adjudicación. No puede aplicarse a cotizaciones ya adjudicadas (ver RN-01).

**Implicación técnica:** El sistema debe almacenar el valor del dólar vigente al momento de cada cotización.

---

## RN-06 — Validez de la oferta

**Regla:** Una cotización tiene una validez referencial de 7 días desde su emisión, pasada la cual pasa al estado `Vencida`.

**Nota:** El vencimiento es automático (job programado), no manual. Un cliente puede aceptar una oferta vencida, pero el precio debe ser re-validado manualmente por el equipo.

---

## RN-07 — Separación de información pública y privada

**Regla:** El sistema maneja dos capas de información sobre cada trabajo:

| Pública (visible al cliente) | Privada (confidencial del taller) |
|---|---|
| Precio final de venta | Costo de materiales |
| Plazos de entrega | Margen de ganancia |
| Condiciones de pago | Horas reales trabajadas |
| Número de plano | Horas presupuestadas por proceso |

El personal de taller (Jefe de Taller y operarios) **nunca debe acceder** a la información privada de costos y márgenes.

---

## RN-08 — Identificación de piezas sin número de plano

**Regla:** Cuando el cliente no provee un número de plano, el sistema genera un ID interno secuencial asociado a las iniciales de la fábrica cliente.

**Formato:** `[INICIALES]-[NRO]`. Ejemplo: `OC-001` para OxyCAM.

**Nota:** Este ID es interno y no reemplaza al número de plano del cliente. Si en el futuro el cliente provee el plano, ambos deben poder convivir como referencia.

---

## RN-09 — Unicidad de planos con variaciones

**Regla:** Si dos piezas comparten el mismo número de plano pero tienen variaciones mínimas (posición, equipos distintos, tolerancias), deben registrarse como piezas **distintas** en el sistema.

**Implicación técnica:** El número de plano no puede ser la única clave de identificación de una pieza. Se necesita un campo adicional de "variante" o "versión".

---

## RN-10 — Acceso restringido para personal de taller

**Regla:** Los usuarios con rol Jefe de Taller (JT) solo pueden:
- Ver las Órdenes de Trabajo asignadas.
- Registrar procesos y tiempos reales de producción.

No tienen acceso a: precios de venta, costos de materiales, márgenes, ni datos financieros de ningún tipo.

---

## RN-11 — Alcance del sistema (exclusión de facturación)

**Regla:** El sistema cubre el ciclo completo desde cotización hasta entrega. La facturación y cobranza quedan **fuera del alcance** de esta versión, por decisión explícita del cliente.

El estado final de una Orden de Trabajo es `Facturado`, pero el detalle del proceso de facturación no es gestionado por este sistema.
