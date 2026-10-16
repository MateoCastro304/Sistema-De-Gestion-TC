# ADR-004 — Generación de PDF

**Fecha:** 2026-08  
**Estado:** Recomendado (pendiente de confirmación)  
**Responsables de la decisión:** Equipo técnico

---

## Contexto y problema

El sistema debe generar informes de cotización en PDF. Cada cliente puede tener un formato específico (algunos lo cargan en su propio sistema y otros requieren una disposición particular). Los PDF deben tener calidad profesional, con tablas, logos y datos estructurados.

## Alternativas consideradas

### Opción A: Servicio Python (WeasyPrint / ReportLab)

Un proceso Python separado que recibe datos estructurados del backend Node.js y devuelve el PDF generado.

**WeasyPrint** convierte HTML/CSS a PDF con alta fidelidad visual (ideal para plantillas centradas en el diseño).  
**ReportLab** genera PDF de forma programática (más control, diseño menos declarativo).

**Ventajas:**
- HTML/CSS como plantilla de PDF es familiar para cualquier desarrollador frontend: el equipo puede mantener las plantillas sin aprender una biblioteca específica para PDF.
- WeasyPrint maneja tablas, estilos y paginación automática: las partes más complejas del informe de cotización.
- Python es el ecosistema más maduro para generar PDF de alta calidad.
- El servicio Python permanece aislado: si debe cambiar la biblioteca, no afecta al backend Node.js.

**Desventajas:**
- Agrega un proceso adicional al despliegue.
- Latencia de comunicación HTTP entre Node.js y Python (tolerable para este caso de uso síncrono).

### Opción B: Node.js con Puppeteer

Puppeteer inicia una instancia de Chromium, renderiza HTML y lo exporta a PDF.

**Ventajas:**
- Sin proceso adicional: todo en el mismo entorno de ejecución Node.js.
- HTML/CSS como plantilla, al igual que WeasyPrint.

**Desventajas:**
- Puppeteer en producción consume muchos recursos (Chromium es pesado). Consume 400 MB de RAM por instancia y el servicio de alojamiento elegido tendrá 1 GB de RAM.
- El PDF resultante puede variar entre versiones de Chromium.
- Problemático en entornos Docker con restricciones de aislamiento.

### Opción C: Node.js con pdfmake

Biblioteca que genera PDF a partir de un JSON descriptivo (no HTML).

**Ventajas:**
- Liviana, sin dependencias de navegador.
- 100 % Node.js.

**Desventajas:**
- Las plantillas se definen en JSON, no en HTML/CSS. Curva de aprendizaje para el diseño.
- Las disposiciones complejas son difíciles de mantener en JSON.

## Decisión

> Estado registrado: **Recomendado (pendiente de confirmación)**. El texto formula la elección, pero no implica aprobación formal; ver [inconsistencias documentales](../seguimiento/inconsistencias-documentales.md#estados-de-los-adr).

**Servicio Python con WeasyPrint**, ejecutado como proceso en el mismo servidor, con comunicación HTTP síncrona desde el backend Node.js y uso ocasional de ReportLab para casos especiales.

**Arquitectura:**
```
Backend NestJS
    │
    │ POST /generate-pdf (datos JSON)
    ▼
Servicio Python (puerto interno, no expuesto)
    │
    │ WeasyPrint renderiza la plantilla HTML + datos
    ▼
    Bytes del PDF → respuesta HTTP → NestJS lo entrega al cliente
```

## Notas críticas de implementación

- El servicio Python **no debe acceder directamente a la base de datos**. Recibe todos los datos necesarios del backend Node.js en la solicitud. Esto evita duplicar la lógica de negocio y mantiene una única fuente de verdad.
- Las plantillas HTML de cada formato de cliente se versionan en el repositorio del servicio Python.
- En desarrollo: iniciar ambos servicios con Docker Compose.
- No usar una cola asíncrona para generar PDF: la generación es síncrona y el usuario espera el archivo. Una cola agregaría complejidad innecesaria para este volumen.
