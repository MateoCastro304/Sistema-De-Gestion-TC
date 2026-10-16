# Plantilla de funcionalidad

Ubicación habitual: `docs/funcionalidades/`.

Usar como guía, no como formulario obligatorio. Elegir los apartados que aporten, combinar los que se superpongan y omitir los demás. Conservar su orden relativo; la numeración es opcional. Una funcionalidad sencilla puede resolverse con una introducción y dos o tres secciones.

El título del documento debe nombrar el área o funcionalidad.

## Propósito y contexto

Explicar qué necesidad resuelve, por qué existe y dónde participa en el sistema. Enlazar el contexto compartido en lugar de repetirlo.

## Alcance y responsabilidades

Delimitar qué resuelve y cuáles son sus límites.

## Actores y objetivos

Identificar participantes, objetivos y restricciones relevantes.

## Conceptos fundamentales

Definir lo necesario para entender la funcionalidad. Enlazar al glosario para los términos compartidos.

## Relaciones y dependencias

Explicar cómo se relacionan los conceptos y las otras áreas, qué significa cada relación y por qué existe. Incluir obligatoriedad, cardinalidad y consecuencias de cambios cuando estén documentadas y sean relevantes.

## Reglas de negocio

Conservar los identificadores de condiciones, restricciones y garantías. Explicar el fundamento solo cuando esté documentado. Enlazar los catálogos existentes para evitar duplicar especificaciones.

## Funcionamiento y flujos de información

Describir escenarios, participantes, información intercambiada y resultados en lenguaje de negocio. Usar la [guía de flujos](flujo-de-acciones.md) cuando el escenario lo justifique.

## Estados y ciclo de vida

Incluir únicamente si hay un ciclo que necesite explicación: significado de estados y condiciones de transición.

## Decisiones y fundamentos

Resumir criterios documentados y enlazar los ADR pertinentes, conservando su estado de aprobación.

## Ejemplo de negocio

Conservar un caso documentado cuando ayude a conectar conceptos, reglas y funcionamiento. No inventar ejemplos para completar la estructura.

## Límites y cuestiones abiertas

Reunir limitaciones, supuestos y preguntas documentados, sin resolver contradicciones ni presentar supuestos como hechos.

## Documentación relacionada

Incluir enlaces útiles que no hayan quedado suficientemente cubiertos en el texto.

Al aplicar esta guía, preservar contenido sustantivo, identificadores y referencias. No crear secciones vacías. Proponer cualquier división o traslado antes de ejecutarlo; las extracciones desde `domain/` requieren identificar fuente, contenido, destino y referencia que permanecerá, y obtener aprobación.
