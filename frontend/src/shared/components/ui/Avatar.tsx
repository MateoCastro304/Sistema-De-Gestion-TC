import { cn } from '@/shared/lib/cn'

/**
 * ============================================================
 * Avatar — cuadradito con las iniciales de un registro
 * ============================================================
 *
 * QUÉ HACE
 * Toma un nombre ("Aceros del Sur"), saca las iniciales ("AS") y las
 * pinta en un cuadrado de color. Sirve para reconocer una fila de un
 * vistazo, sin tener que leer el texto completo.
 *
 * CÓMO FUNCIONA
 * No tiene estado ni efectos: es una función pura nombre -> JSX. Todo
 * lo visual vive en la clase `.avatar` del styles.css (bloque
 * "REDISEÑO PROVEEDORES", sección 6). El componente sólo decide qué
 * clases poner:
 *   - `.avatar`         siempre
 *   - `.avatar--ambar`  / `.avatar--verde`   si el tono no es el default
 *   - `.avatar--lg`     si es la versión grande
 *
 * POR QUÉ LOS TONOS SE LLAMAN IGUAL QUE LOS DE BADGE
 * Para que en una misma fila el color del avatar y el de la etiqueta
 * de categoría sean el mismo sin tener que mapear nada: si la fila es
 * `tone="ambar"`, el Badge de esa fila es `variant="ambar"`.
 *
 * CÓMO SE USA
 *   <Avatar name={supplier.name} tone="ambar" />
 *   <Avatar name={supplier.name} size="lg" />   // encabezado de detalle
 *
 * ACCESIBILIDAD
 * Lleva `aria-hidden`: las iniciales son decorativas y el nombre real
 * ya está escrito al lado. Si el lector de pantalla las leyera, diría
 * "A S Aceros del Sur", que no aporta nada.
 */

/** Tonos de categoría. Mismos nombres que las variantes de Badge. */
export type AvatarTone = 'azul' | 'ambar' | 'verde' | 'neutral'

interface AvatarProps {
  /** Nombre completo; de acá salen las iniciales. */
  name: string
  tone?: AvatarTone
  /** `lg` es la versión grande del encabezado de detalle. */
  size?: 'md' | 'lg'
}

/**
 * "Aceros del Sur" -> "AS"
 * Corta en 2 palabras: con tres letras el cuadrado queda apretado y
 * deja de leerse. Si el nombre es una sola palabra, devuelve 1 letra.
 */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export function Avatar({ name, tone = 'azul', size = 'md' }: AvatarProps) {
  return (
    <span
      className={cn('avatar', tone !== 'azul' && `avatar--${tone}`, size === 'lg' && 'avatar--lg')}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
