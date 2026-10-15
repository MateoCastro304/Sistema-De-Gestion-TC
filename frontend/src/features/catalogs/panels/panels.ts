import type { EntityIconName } from '@/shared/components/ui'
import fotoEjes from '@/assets/foto-ejes.webp'
import fotoCono from '@/assets/foto-cono.webp'
import fotoPrensa from '@/assets/foto-prensa.webp'
import fotoDisco from '@/assets/foto-disco.webp'
import fotoHero from '@/assets/hero-castro.webp'
import fotoBronce from '@/assets/foto-piezas-bronce.webp'

/**
 * Los paneles de tarjetas del menú. "Clientes" y "Gestión" no son un
 * catálogo: son la puerta a varios. Cada tarjeta lleva a un listado.
 *
 * De acá sale también el menú lateral (qué ítem marcar) y la miga de pan
 * de la topbar (de qué panel cuelga cada listado), así que agregar un
 * catálogo nuevo a un panel es una entrada en `items`.
 *
 * Gestión muestra por ahora sólo Proveedores: Materiales y Tipos de
 * proceso son del sprint 2 y se suman acá cuando existan sus pantallas.
 */
export interface PanelItem {
  /** Ruta del listado. */
  to: string
  label: string
  description: string
  icon: EntityIconName
  photo: string
  /** background-position de la foto: cada una tiene su encuadre. */
  photoPosition: string
}

export interface Panel {
  to: string
  label: string
  eyebrow: string
  accent: string
  description: string
  photo: string
  photoPosition: string
  items: PanelItem[]
}

export const PANELS = {
  clientes: {
    to: '/catalogos/clientes',
    label: 'Clientes',
    eyebrow: 'Catálogo de',
    accent: 'clientes',
    description: 'Fábricas cliente, sus encargados y los rubros.',
    photo: fotoEjes,
    photoPosition: 'center 45%',
    items: [
      {
        to: '/catalogos/encargados',
        label: 'Encargados',
        description: 'Personas de contacto de cada fábrica.',
        icon: 'encargado',
        photo: fotoCono,
        photoPosition: 'center 40%',
      },
      {
        to: '/catalogos/fabricas',
        label: 'Fábricas',
        description: 'Empresas cliente con su CUIT, rubro y formas de pago.',
        icon: 'fabrica',
        photo: fotoPrensa,
        photoPosition: 'center 40%',
      },
      {
        to: '/catalogos/rubros',
        label: 'Rubros',
        description: 'Rubros para clasificar a las fábricas.',
        icon: 'rubro',
        photo: fotoDisco,
        photoPosition: 'center 45%',
      },
    ],
  },
  gestion: {
    to: '/catalogos/gestion',
    label: 'Gestión',
    eyebrow: 'Catálogo',
    accent: 'técnico',
    description: 'Datos técnicos que se usan al cotizar.',
    photo: fotoHero,
    photoPosition: '65% center',
    items: [
      {
        to: '/catalogos/proveedores',
        label: 'Proveedores',
        description: 'Proveedores de material, repuestos, pintura y servicios tercerizados.',
        icon: 'proveedor',
        photo: fotoBronce,
        photoPosition: 'center 60%',
      },
    ],
  },
} satisfies Record<string, Panel>

export type PanelKey = keyof typeof PANELS

/** El panel del que cuelga un listado ("/catalogos/encargados" → Clientes). */
export function panelOf(pathname: string): Panel | undefined {
  return Object.values(PANELS).find(
    (panel) =>
      pathname.startsWith(panel.to) ||
      panel.items.some((item) => pathname === item.to || pathname.startsWith(item.to + '/')),
  )
}
