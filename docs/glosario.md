# Glosario

Términos del negocio compartidos por la documentación. Las definiciones provienen de la ERS, los casos de uso y el modelo de dominio V1.1 (antes en [01-introduccion-alcance.md, §9](dominio/01-introduccion-alcance.md#9-glosario-del-dominio)). El glosario completo del cliente está en el Anexo B [GLO].

Las abreviaturas de los actores (JT, ERP, ER, EC, AT, AS…) están en las [convenciones del dominio, §2.4](dominio/00-indice-y-convenciones.md#24-abreviaturas-de-actores), y los estados de cotizaciones y órdenes de trabajo, en las [máquinas de estado](dominio/06-maquinas-de-estado.md).

| Término | Definición |
|---|---|
| **Adjudicación** | Aprobación de la cotización por el cliente, total o parcial, que se concreta con la Orden de Compra. |
| **Borrador** | Estado de una cotización empezada y guardada sin emitir; no corre el plazo de validez. |
| **Camino de la pieza** | Ciclo completo: pedido de cotización → cotización → OC → construcción → entrega → facturación. |
| **Conjunto / Ensamblaje** | Ítem compuesto por piezas hijas más procesos propios del conjunto (ensamblaje, pintura general, tratamiento final). |
| **Cotización (presupuesto)** | Oferta económica formal, con número correlativo, para una solicitud. |
| **Demora** | Condición, no estado, de un trabajo adjudicado que todavía no se finalizó y cuya fecha de entrega pactada ya pasó; no altera su avance por los estados ([RN38](dominio/02-reglas-de-negocio.md#rn38--marcado-automático-de-trabajos-demorados)). |
| **Desvío** | Diferencia entre lo planificado (horas, material) y lo real registrado en la hoja de ruta. |
| **Empleado** | Persona del personal de la empresa. Puede tener o no un usuario; su baja lógica desactiva el usuario asociado ([RN44](dominio/02-reglas-de-negocio.md)). |
| **Encargado cliente** | Persona de una fábrica cliente que pide cotizaciones. |
| **Fábrica cliente** | Empresa cliente; un particular se registra como fábrica de rubro «Particular». |
| **Hoja de ruta** | Tabla impresa de procesos que acompaña la pieza por el taller, donde cada responsable anota tiempo y observaciones. |
| **Ítem** | Unidad que se presupuesta y que, si se adjudica, se fabrica. |
| **Número de plano** | Identificador de la pieza provisto por el cliente. Sin plano, el sistema genera uno interno (p. ej. `OC-001`). |
| **Orden de Compra (OC)** | Documento o mensaje del cliente que adjudica la cotización; puede ser formal (PDF/Excel) o informal (WhatsApp). |
| **Orden de Trabajo (OT)** | Registro operativo que autoriza y organiza la fabricación de un ítem adjudicado. |
| **Pieza patrón** | Pieza física de muestra provista por el cliente cuando no hay plano; se registra con fotos. |
| **Precio pactado** | Precio acordado con el cliente al adjudicar; queda congelado en la OT (🔁 D-02). |
| **Presentación** | Forma en que se compra el material: cilindro sólido, hexágono, planchuela, caño, cortado por hilo o láser… |
| **Proceso propio** | Trabajo hecho en el taller, cobrado por hora según su tipo (torno manual, CNC, herrería…). |
| **Proceso tercerizado** | Servicio contratado afuera (zincado, galvanizado, tratamiento térmico, corte por hilo), costeado por precio total. |
| **Recotización** | Nueva cotización emitida para la misma solicitud cuando la anterior venció o el cliente pide cambios. |
| **Reparación** | Ítem compuesto por piezas más procesos de reparación (armado, desarmado…). |
| **Rol** | Perfil de acceso asignado al usuario, no al empleado. Los roles son exactamente JT, ERP, ER, EC, AT y AS; un usuario puede tener varios y sus permisos se suman ([RN44](dominio/02-reglas-de-negocio.md), [roles y permisos](conceptos-transversales/roles-y-permisos.md)). |
| **Seña** | Adelanto solicitado, expresado como porcentaje del precio final. |
| **Solicitud de cotización** | Pedido de un cliente, recibido por correo o WhatsApp, que el ERP registra con su documentación; al registrarse crea la cotización asociada ([RN03](dominio/02-reglas-de-negocio.md#rn03--registro-obligatorio-de-la-solicitud-de-cotización), [CU-13](dominio/04-actores-y-casos-de-uso.md#cu-13--registrar-solicitud-de-cotización)). |
| **Usuario** | Cuenta de acceso al sistema. Cada usuario pertenece a un empleado y tiene uno o más roles ([modelo de dominio, §2.6](dominio/05-modelo-de-dominio.md#26-proveedores-personal-y-acceso)). |
