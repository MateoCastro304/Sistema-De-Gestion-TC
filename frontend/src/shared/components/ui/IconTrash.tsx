interface IconTrashProps {
  /** Tamaño en px. 19 es el de los íconos del menú; 18 el de las filas. */
  size?: number
}

/**
 * Tachito de basura (diseñado en Claude Design).
 *
 * Mismo lenguaje que los íconos del menú: trazo de 1.8, esquinas
 * redondeadas, sin relleno y con `currentColor` (el color lo pone el
 * botón que lo contiene, no el SVG).
 *
 * La tapa y la manija van juntas en un `<g className="lid">`: el CSS
 * las rota sobre la bisagra izquierda para abrirla en el hover (ver
 * "BOTÓN DE ELIMINAR" en styles.css). Por eso el grupo no se puede
 * quitar ni renombrar.
 *
 * `overflow: visible` es necesario: el dibujo ya toca y=3, así que la
 * tapa abierta se sale de la caja y el svg la recortaría. Se resuelve
 * dejándola pintar afuera y NO agrandando el viewBox: con aire arriba
 * el dibujo queda descentrado respecto del texto del botón.
 */
export function IconTrash({ size = 18 }: IconTrashProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <g className="lid">
        {/* tapa */}
        <path d="M3 5.6h14" />
        {/* manija */}
        <path d="M7.8 5.6V4.3a1.3 1.3 0 0 1 1.3-1.3h1.8a1.3 1.3 0 0 1 1.3 1.3v1.3" />
      </g>
      {/* cuerpo, apenas cónico como un tacho real */}
      <path d="M5.1 5.6h9.8l-.7 9.6a1.6 1.6 0 0 1-1.6 1.5H7.4a1.6 1.6 0 0 1-1.6-1.5z" />
      {/* rayitas interiores: son las que lo hacen leer como tacho
          y no como una bolsa */}
      <path d="M8.4 8.8v4.6M11.6 8.8v4.6" />
    </svg>
  )
}
