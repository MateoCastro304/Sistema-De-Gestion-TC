# ADR-007 — Integración de correo electrónico

**Fecha:** 2026-08  
**Estado:** Orientación arquitectónica definida; proveedor pendiente de confirmación de presupuesto  
**Responsables de la decisión:** Equipo técnico

---

## Contexto

El correo electrónico cumple los mismos dos roles que WhatsApp en la ERS: canal de recepción de solicitudes de cotización (UC-13, registro manual) y canal de salida automático para el informe de cotización (UC-21). El modelo de dominio lo representa mediante **SC (Servidor de correo)**, un actor externo abstracto no ligado a ningún proveedor.

Esta decisión cubre únicamente el correo transaccional saliente: enviar al cliente el informe de cotización generado por el sistema como PDF. El procesamiento de buzones de entrada queda fuera del alcance, de acuerdo con la ERS.

## Opciones evaluadas

### Opción A: SMTP corporativo (Gmail / Google Workspace)

**Ventajas:**
- Sin costo adicional si la empresa ya tiene un buzón corporativo.
- El cliente recibe el correo desde una dirección que puede reconocer.

**Desventajas:**
- Diseñado para uso humano, no para envíos automatizados desde una aplicación; riesgo de que el proveedor marque el patrón de envío como sospechoso.
- Sin seguimiento confiable de rebotes o fallas de entrega.
- Requiere manejar las credenciales de la cuenta corporativa real dentro del backend.
- Un problema de reputación en el canal automatizado puede afectar al buzón que usa el resto de la empresa.

### Opción B: Servicio de correo transaccional de terceros (Resend, SendGrid, Postmark)

**Ventajas:**
- Buena capacidad de entrega de base, con configuración guiada de SPF/DKIM/DMARC.
- Seguimiento de entregas y rebotes mediante webhooks.
- Integración sencilla por API o SMTP.
- Aísla el canal automatizado del buzón real de la empresa.
- Plan gratuito suficiente para el volumen del proyecto.

**Desventajas:**
- Agrega un proveedor externo con su propia cuenta, panel y credenciales, fuera de la cuenta AWS ya adoptada en ADR-009.

### Opción C: Amazon SES

**Ventajas:**
- Misma capacidad de entrega y seguimiento que la opción B.
- Permanece dentro de la cuenta AWS ya definida en ADR-009 (mismo IAM, misma facturación; los rebotes pueden dirigirse a CloudWatch/SNS).
- Bajo costo por mensaje para el volumen estimado del proyecto.
- No agrega una nueva relación con un proveedor.

**Desventajas:**
- El envío comienza en modo de pruebas restringido y requiere solicitar un aumento del límite antes de usarlo en producción.
- Requiere verificar un dominio de envío adecuado con SPF/DKIM/DMARC, igual que cualquier otra opción de esta categoría.

### Opción D: Servidor de correo autogestionado

**Ventajas:**
- Control completo sobre la infraestructura de envío.

**Desventajas:**
- Requiere gestionar manualmente la reputación de IP, SPF/DKIM/DMARC y las listas de bloqueo.
- Sin ventajas frente a un servicio administrado para este volumen; se considera sobrediseño para la escala del proyecto.

## Recomendación provisional

Se descarta la opción D por sobrediseño y la opción A por su falta de trazabilidad de entrega y el riesgo que representa para el buzón real de la empresa. Entre las opciones B y C, el equipo se inclina provisionalmente por **Amazon SES** (opción C), por su coherencia con la infraestructura ya definida en ADR-009. Si el presupuesto que confirme el cliente o algún requisito no cubierto por SES hace más adecuado a Resend o SendGrid, la opción B sigue siendo una alternativa válida.

## Decisión

La decisión final es adoptar un **servicio administrado de correo transaccional** como orientación arquitectónica; se descartan SMTP corporativo y un servidor autogestionado.

La elección entre un proveedor externo (opción B) y Amazon SES (opción C) no queda cerrada en este ADR: está condicionada a que el Product Owner confirme con el cliente el presupuesto mensual disponible para esta integración. Hasta esa confirmación, Amazon SES es el proveedor recomendado por el equipo técnico.

La integración se limitará al envío de cotizaciones. El sistema enviará el PDF de cotización generado a la dirección de correo registrada del cliente y no procesará ni automatizará las conversaciones posteriores por correo.

## Pendientes

**Decisiones de arquitectura:** ninguna pendiente; está definido el uso de un servicio administrado de correo transaccional en lugar de SMTP corporativo o un servidor autogestionado.

**Decisiones de negocio / presupuesto:**
- El Product Owner debe consultar y confirmar con el cliente el presupuesto mensual disponible para correo, junto con el de WhatsApp, y usarlo para elegir entre Amazon SES y un proveedor externo (Resend, SendGrid).
- Confirmar con el cliente si Tornería Castro ya tiene un dominio de correo empresarial adecuado como dirección de remitente o si debe adquirirse uno. Esto aplica tanto a la opción B como a la C, no solo a SES.

**Tareas futuras de implementación:**
- Verificar el dominio de envío (SPF, DKIM, DMARC) una vez definido el proveedor.
- Solicitar acceso de producción al proveedor elegido (por ejemplo, salir del modo de pruebas restringido de SES).
- Definir la plantilla HTML de correo acorde con la identidad visual de Tornería Castro.
- Registrar rebotes y fallas de entrega, y alertar al Encargado de Cotización cuando un correo de cotización no pueda entregarse.
