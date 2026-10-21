import type { EntityIconName } from '@/shared/components/ui'
import { canAccess, type AppModule, type Rol } from '@/domain/roles'
import fotoEjes from '@/assets/foto-ejes.webp'
import fotoCono from '@/assets/foto-cono.webp'
import fotoPrensa from '@/assets/foto-prensa.webp'
import fotoDisco from '@/assets/foto-disco.webp'
import fotoHero from '@/assets/hero-castro.webp'
import fotoBronce from '@/assets/foto-piezas-bronce.webp'
import fotoCnc from '@/assets/foto-cnc.webp'
/**
 * Los paneles de tarjetas del menú. "Clientes" y "Gestión" no son un
 * catálogo: son la puerta a varios. Cada tarjeta lleva a un listado.
 *
 * De acá sale también el menú lateral (qué ítem marcar) y la miga de pan
 * de la topbar (de qué panel cuelga cada listado), así que agregar un
 * catálogo nuevo a un panel es una entrada en `items`.
 *
 * Gestión muestra Proveedores y Tipos de proceso; Materiales se suma
 * cuando exista su pantalla.
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
      {
        to: '/catalogos/tipos-de-proceso',
        label: 'Tipos de proceso',
        description: 'Procesos propios del taller con su precio por hora.',
        icon: 'proceso',
        photo: fotoCnc,
        photoPosition: 'center 55%',
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

/**
 * La URL de cada módulo de la matriz de permisos (`MODULE_ROLES`), con sus
 * altas y detalles abajo. Incluye los del Sprint 2 que todavía no tienen
 * tarjeta (las rutas de `e2e/support/routes.ts`), así una URL de otro rol
 * muestra "Acceso denegado" aunque la pantalla no exista todavía.
 */
const MODULE_PATHS: Record<AppModule, string> = {
  customers: '/catalogos/encargados',
  factories: '/catalogos/fabricas',
  categories: '/catalogos/rubros',
  suppliers: '/catalogos/proveedores',
  employees: '/administracion/empleados',
  users: '/administracion/usuarios',
  processTypes: '/catalogos/tipos-de-proceso',
  materials: '/catalogos/materiales',
}

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + '/')
}

/** Las tarjetas del panel que permiten esos roles. */
export function visibleItems(panel: Panel, roles: readonly Rol[]): PanelItem[] {
  return panel.items.filter((item) => canOpen(item.to, roles))
}

/**
 * Si esos roles pueden abrir la URL (CU-53, escenario 8). Un módulo, según
 * `canAccess()`; un panel, si muestra alguna tarjeta. Lo demás (el inicio,
 * una URL que no existe) no pide rol.
 */
export function canOpen(pathname: string, roles: readonly Rol[]): boolean {
  const entry = Object.entries(MODULE_PATHS).find(([, base]) => isUnder(pathname, base))
  if (entry) return canAccess(roles, entry[0] as AppModule)

  const panel = Object.values(PANELS).find((p) => pathname === p.to)
  if (panel) return visibleItems(panel, roles).length > 0

  return true
}

/**
 * La primera pantalla que permiten esos roles (CU-53, escenario 1): el
 * primer panel con alguna tarjeta, en el orden del menú. `null` si no tienen
 * ningún módulo (Jefe de Taller, Encargado de Reportes).
 */
export function homePathFor(roles: readonly Rol[]): string | null {
  const panel = Object.values(PANELS).find((p) => visibleItems(p, roles).length > 0)
  return panel?.to ?? null
}
