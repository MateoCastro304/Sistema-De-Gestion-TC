# ADR-004 — Generación de PDFs

**Fecha:** 2026-08  
**Estado:** Recomendado (pendiente confirmación)  
**Decisores:** Equipo técnico

---

## Contexto

El sistema debe generar informes de cotización en PDF. Cada cliente puede tener un formato específico (algunos cargan en su sistema, otros requieren un layout particular). Los PDFs deben tener calidad profesional con tablas, logos, y datos estructurados.

## Opciones evaluadas

### Opción A: Servicio Python (WeasyPrint / ReportLab) ✅ Recomendada

Un proceso Python separado que recibe datos estructurados del backend Node.js y devuelve el PDF generado.

**WeasyPrint** convierte HTML/CSS a PDF con alta fidelidad visual (ideal para templates con diseño).  
**ReportLab** genera PDFs programáticamente (más control, menos diseño declarativo).

**A favor:**
- HTML/CSS como template de PDF es familiar para cualquier frontend dev: el equipo puede mantener los templates sin aprender una librería de PDF específica.
- WeasyPrint maneja tablas, estilos, y paginación automática — los casos más complejos del informe de cotización.
- Python es el ecosistema más maduro para generación de PDFs de alta calidad.
- El servicio Python queda aislado: si hay que cambiar la librería, no afecta el backend Node.js.

**En contra:**
- Agrega un proceso adicional al deployment.
- Latencia de comunicación HTTP entre Node.js y Python (tolerable para este caso de uso síncrono).

### Opción B: Node.js con Puppeteer

Puppeteer lanza una instancia de Chromium, renderiza HTML, y exporta a PDF.

**A favor:**
- Sin proceso adicional: todo en el mismo runtime de Node.js.
- HTML/CSS como template, igual que WeasyPrint.

**En contra:**
- Puppeteer en producción es costoso en recursos (Chromium es pesado).
- El PDF resultante puede variar entre versiones de Chromium.
- Problemático en entornos Docker con restricciones de sandbox.

### Opción C: Node.js con pdfmake

Librería que genera PDFs a partir de un JSON descriptivo (no HTML).

**A favor:**
- Liviano, sin dependencias de navegador.
- 100% en Node.js.

**En contra:**
- Los templates se definen en JSON, no en HTML/CSS. Curva de aprendizaje para diseño.
- Layouts complejos son difíciles de mantener en JSON.

## Decisión

**Servicio Python con WeasyPrint**, corriendo como proceso en el mismo servidor, con comunicación HTTP síncrona desde el backend Node.js.

**Arquitectura:**
```
Backend NestJS
    │
    │ POST /generate-pdf (datos JSON)
    ▼
Servicio Python (puerto interno, no expuesto)
    │
    │ WeasyPrint renderiza HTML template + datos
    ▼
    PDF en bytes → respuesta HTTP → NestJS lo sirve al cliente
```

## Notas de implementación críticas

- El servicio Python **no debe acceder directamente a la base de datos**. Recibe todos los datos necesarios del backend Node.js en el request. Esto evita duplicar la lógica de negocio y mantiene un único punto de verdad.
- Los templates HTML para cada formato de cliente se versionan en el repositorio del servicio Python.
- En desarrollo: levantar ambos servicios con Docker Compose.
- No usar cola asíncrona para la generación de PDF: la generación es síncrona y el usuario espera el archivo. Una cola agregaría complejidad innecesaria para este volumen.
