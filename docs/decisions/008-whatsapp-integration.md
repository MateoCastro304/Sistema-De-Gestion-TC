# ADR-008 — Integración de WhatsApp

**Fecha:** 2026-08  
**Estado:** Orientación arquitectónica definida; proveedor pendiente de confirmación de presupuesto  
**Responsables de la decisión:** Equipo técnico

---

## Contexto y problema

La ERS habilita WhatsApp en dos puntos: recepción de solicitudes de cotización (UC-13, registro manual con documentación adjunta) y envío automático del informe de cotización (UC-21, con la vigencia de la oferta ligada a ese envío mediante la regla de negocio RN-06). El modelo de dominio lo representa mediante **SM (Servidor de mensajería)**, un actor externo abstracto no ligado a ningún proveedor.

La recepción de solicitudes y órdenes de compra por WhatsApp sigue siendo un paso de registro manual (RN-01, RN-03); el procesamiento de mensajes entrantes queda fuera del alcance. Lo que requiere una integración real es el envío saliente del PDF de cotización.

Por lo tanto, la integración se limita a enviar el informe de cotización y un breve mensaje de acompañamiento al número de WhatsApp registrado del cliente. El sistema no gestiona ni automatiza la conversación posterior con el cliente.

## Alternativas consideradas

### Opción A: Bibliotecas no oficiales (whatsapp-web.js, Baileys)

**Ventajas:**
- Sin costo por mensaje ni aprobación previa de Meta.
- Mensajes de texto completamente libres, sin restricciones de plantillas.

**Desventajas:**
- Incumple los términos de servicio de WhatsApp; riesgo de bloqueo del número, que también se utiliza para recibir órdenes de compra (RN-01/RN-03).
- Requiere mantener una sesión vinculada a un dispositivo (volver a escanear el QR periódicamente), inestable para un proceso de servidor sin supervisión.
- Sin soporte oficial ni SLA.

### Opción B: WhatsApp Business Platform oficial mediante un BSP externo (Twilio, 360dialog, Gupshup)

**Ventajas:**
- Cumple los términos de servicio de Meta.
- Gestión madura y bien documentada de plantillas y webhooks.
- Independencia del proveedor: permite cambiar de BSP sin cambiar de plataforma.

**Desventajas:**
- Agrega un proveedor, un contrato y facturación fuera de la cuenta AWS ya adoptada en ADR-009.
- Requiere gestionar credenciales adicionales y un panel separado.

### Opción C: WhatsApp Business Platform oficial mediante AWS End User Messaging Social

**Ventajas:**
- Misma Meta Cloud API y mismas garantías de cumplimiento que la opción B.
- Permanece dentro de la cuenta AWS ya definida en ADR-009 (mismo IAM, misma facturación; los registros pueden centralizarse en CloudWatch).
- No agrega una nueva relación con un proveedor para el equipo.

**Desventajas:**
- Menor documentación de terceros y comunidad que un BSP establecido como Twilio.
- Depende de la disponibilidad de la cuenta AWS, una dependencia que el resto del sistema ya asume según ADR-009.

## Decisión

La decisión final es adoptar la **WhatsApp Business Platform oficial** como orientación arquitectónica; se descartan las bibliotecas no oficiales.

La elección entre un BSP externo (opción B) y AWS End User Messaging Social (opción C) no queda cerrada en este ADR: está condicionada a que el Product Owner confirme con el cliente el presupuesto mensual disponible para esta integración. Hasta esa confirmación, AWS End User Messaging Social es el proveedor recomendado por el equipo técnico.

La integración se limitará al envío de cotizaciones. El sistema enviará el PDF generado junto con un mensaje breve y no procesará ni automatizará las conversaciones posteriores con el cliente.

## Fundamentos (recomendación provisional)

Se descarta la opción A: el riesgo de bloqueo del número compromete un canal que también recibe órdenes de compra, no solo notificaciones salientes. Entre las opciones B y C, el equipo se inclina provisionalmente por **AWS End User Messaging Social** (opción C), por su coherencia con la infraestructura ya definida en ADR-009. Si el presupuesto que confirme el cliente o algún requisito operativo no cubierto por AWS hace más adecuado a un BSP externo, la opción B sigue siendo una alternativa válida.

## Referencias y pendientes

**Decisiones de arquitectura:** ninguna pendiente; está definido el uso de la WhatsApp Business Platform oficial.

**Decisiones de negocio / presupuesto:**
- El Product Owner debe consultar y confirmar con el cliente el presupuesto mensual disponible para WhatsApp y usarlo como criterio para elegir entre AWS End User Messaging Social y un BSP externo.
- Confirmar la tarifa exacta por mensaje para Argentina una vez definido el proveedor.

**Tareas futuras de implementación:**
- Iniciar la verificación de WABA en Meta Business Manager.
- Aprovisionar el número telefónico dedicado de WhatsApp Business.
- Definir y presentar para aprobación la plantilla necesaria para enviar cotizaciones, si la integración y el escenario de mensajería seleccionados lo requieren.
- Registrar el estado de entrega/lectura de los mensajes salientes para que se pueda avisar al Encargado de Cotización sobre un envío fallido.
