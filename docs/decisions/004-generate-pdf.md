# ADR-004 — PDF Generation

**Date:** 2026-08  
**Status:** Recommended (pending confirmation)  
**Decision makers:** Technical team

---

## Context

The system must generate quote reports in PDF. Each customer may have a specific format (some load it into their own system, others require a particular layout). The PDFs must have professional quality with tables, logos, and structured data.

## Options evaluated

### Option A: Python service (WeasyPrint / ReportLab)

A separate Python process that receives structured data from the Node.js backend and returns the generated PDF.

**WeasyPrint** converts HTML/CSS to PDF with high visual fidelity (ideal for design-driven templates).  
**ReportLab** generates PDFs programmatically (more control, less declarative design).

**Pros:**
- HTML/CSS as the PDF template is familiar to any frontend dev: the team can maintain the templates without learning a PDF-specific library.
- WeasyPrint handles tables, styles, and automatic pagination — the most complex parts of the quote report.
- Python is the most mature ecosystem for high-quality PDF generation.
- The Python service stays isolated: if the library needs to change, it doesn't affect the Node.js backend.

**Cons:**
- Adds an additional process to the deployment.
- HTTP communication latency between Node.js and Python (tolerable for this synchronous use case).

### Option B: Node.js with Puppeteer

Puppeteer launches a Chromium instance, renders HTML, and exports to PDF.

**Pros:**
- No additional process: everything in the same Node.js runtime.
- HTML/CSS as the template, same as WeasyPrint.

**Cons:**
- Puppeteer in production is resource-intensive (Chromium is heavy). It consumes 400MB of RAM per instance, and the chosen hosting service will have 1GB of RAM.
- The resulting PDF can vary between Chromium versions.
- Problematic in Docker environments with sandbox restrictions.


### Option C: Node.js with pdfmake

Library that generates PDFs from a descriptive JSON (not HTML).

**Pros:**
- Lightweight, no browser dependencies.
- 100% Node.js.

**Cons:**
- Templates are defined in JSON, not HTML/CSS. Learning curve for design.
- Complex layouts are hard to maintain in JSON.

## Decision

**Python service with WeasyPrint**, running as a process on the same server, with synchronous HTTP communication from the Node.js backend, with occasional use of ReportLab for special cases.

**Architecture:**
```
NestJS Backend
    │
    │ POST /generate-pdf (JSON data)
    ▼
Python service (internal port, not exposed)
    │
    │ WeasyPrint renders HTML template + data
    ▼
    PDF bytes → HTTP response → NestJS serves it to the client
```

## Critical implementation notes

- The Python service **must not access the database directly**. It receives all the necessary data from the Node.js backend in the request. This avoids duplicating business logic and keeps a single source of truth.
- HTML templates for each customer format are versioned in the Python service's repository.
- In development: bring up both services with Docker Compose.
- Do not use an async queue for PDF generation: generation is synchronous and the user waits for the file. A queue would add unnecessary complexity for this volume.