import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router'
import logoBlanco from '@/assets/logo-castro-white.png'
import logoMarino from '@/assets/logo-castro-navy.png'

/**
 * ============================================================
 * AppLayout — el marco de toda la app
 * ============================================================
 *
 * QUÉ CAMBIÓ EN EL REDISEÑO
 * El árbol de la página (aside + main + Outlet) y las rutas son los
 * mismos. Lo que se agregó es el manejo del menú:
 *   - en escritorio, la barra se puede colapsar a un riel de íconos;
 *   - en celular, la barra es un cajón que entra desde la izquierda;
 *   - los ítems ahora salen de un array y llevan ícono.
 * Nada de esto toca datos ni navegación: sólo estado local de la UI.
 *
 * DOS ESTADOS, NO UNO
 * `collapsed` y `drawerOpen` son cosas distintas a propósito, porque
 * el gesto es distinto: en escritorio la barra se achica y el
 * contenido se corre; en celular la barra entra por encima del
 * contenido y se cierra sola al navegar.
 */

/** Rótulo de la topbar según el segmento de la URL. Sin cambios. */
const SECTION_LABELS: Record<string, string> = {
  encargados: 'Encargados',
  fabricas: 'Fábricas',
  rubros: 'Rubros',
  proveedores: 'Proveedores',
}

function sectionLabel(pathname: string): string {
  const segment = pathname.match(/^\/catalogos\/([^/]+)/)?.[1]
  return (segment && SECTION_LABELS[segment]) || 'Catálogos'
}

/**
 * Ítems del menú en un array: agregar una sección nueva es una línea
 * acá, no tres bloques de JSX repetidos.
 */
const NAV_ITEMS = [
  { to: '/catalogos/encargados', label: 'Encargados', icon: IconPersona },
  { to: '/catalogos/fabricas', label: 'Fábricas', icon: IconFabrica },
  { to: '/catalogos/rubros', label: 'Rubros', icon: IconEtiqueta },
  { to: '/catalogos/proveedores', label: 'Proveedores', icon: IconCaja },
]

export function AppLayout() {
  const { pathname } = useLocation()

  /** Escritorio: barra ancha o riel de íconos. */
  const [collapsed, setCollapsed] = useState(false)
  /** Celular: cajón abierto o cerrado. */
  const [drawerOpen, setDrawerOpen] = useState(false)

  /* Al navegar el cajón se cierra solo (ver el onClick de los
     NavLink más abajo). Se hace en el evento y no en un useEffect
     sobre `pathname` porque llamar a setState dentro de un efecto
     dispara un render en cascada, y el lint del proyecto lo marca
     como error (react-hooks/set-state-in-effect). */

  /* Al cruzar el corte de 900px el cajón se cierra. Si no, quedaba
     abierto "de fondo" al agrandar la ventana y reaparecía abierto al
     volver a achicarla. El setState va en el callback del evento, no en
     el cuerpo del efecto, así que no choca con set-state-in-effect.
     El 901 tiene que coincidir con el max-width: 900px de styles.css. */
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)')
    const onChange = () => setDrawerOpen(false)
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  /** Escape cierra el cajón: gratis y esperable. */
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const sidebarClass = [
    'sidebar',
    collapsed && 'sidebar--collapsed',
    drawerOpen && 'sidebar--open',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="app">
      <aside className={sidebarClass}>
        {/* Marca. Colapsada, el CSS esconde el logo y el botón de tres
            líneas ocupa su lugar. Se renderiza siempre (y no con
            `!collapsed &&`) porque `collapsed` sobrevive al achicar la
            ventana: en el cajón de celular, que nunca se colapsa, la
            marca desaparecía. */}
        <div className="sidebar__brand">
          <img className="sidebar__logo" src={logoBlanco} alt="Castro Tornería S.R.L." />
          <button
            type="button"
            className="sidebar__burger"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Abrir el menú' : 'Achicar el menú'}
            aria-expanded={!collapsed}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__section">
            <span className="sidebar__section-label">Catálogos</span>
            <ul className="sidebar__list">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    /* El title es lo que queda cuando la barra está
                       colapsada y sólo se ve el ícono. */
                    title={label}
                    /* En celular, entrar a una sección cierra el
                       cajón; en escritorio no hay cajón abierto, así
                       que esto no hace nada. */
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                    }
                  >
                    <Icon />
                    {/* El span es necesario: el CSS lo esconde en modo
                        riel sin tocar el ícono. */}
                    <span className="sidebar__link-text">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <span className="sidebar__tagline">
          Transformando metales con precisión desde 1977.
        </span>
      </aside>

      {/* Fondo oscurecido del cajón. Sólo existe en celular y sólo
          cuando está abierto; tocarlo cierra. Es un <button> y no un
          <div> para que también se pueda cerrar con teclado. */}
      {drawerOpen && (
        <button
          type="button"
          className="app__backdrop"
          aria-label="Cerrar el menú"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className="main">
        <header className="topbar">
          {/* Escritorio: dónde estás. Celular: el CSS lo esconde y muestra
              el logo, porque ahí el menú (y su logo) está guardado. */}
          <div className="topbar__breadcrumb">
            <span>Catálogos</span>
            <span aria-hidden="true">/</span>
            <span className="topbar__breadcrumb-item--current">{sectionLabel(pathname)}</span>
          </div>
          <img className="topbar__logo" src={logoMarino} alt="Castro Tornería S.R.L." />
          {/* Este botón sólo se ve en celular (display:none arriba de
              900px). El de escritorio vive dentro de la barra lateral. */}
          <button
            type="button"
            className="topbar__burger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir el menú"
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

/* ---- Íconos ----
   Inline y con stroke="currentColor" para que tomen el color del
   estado (claro normal, azul en el activo) sin CSS extra. Están
   declarados con `function` (no const) para poder referenciarlos
   desde NAV_ITEMS, que está más arriba en el archivo. */

function IconPersona() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="10" cy="7" r="3.2" />
      <path d="M4 16.5c.9-2.8 3.2-4.2 6-4.2s5.1 1.4 6 4.2" strokeLinecap="round" />
    </svg>
  )
}

function IconFabrica() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 17V8.5l4.5 3V8.5l4.5 3V5h5v12z" strokeLinejoin="round" />
    </svg>
  )
}

function IconEtiqueta() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3h6.5l7.5 7.5-6.5 6.5L3 9.5z" strokeLinejoin="round" />
      <circle cx="6.8" cy="6.8" r="1.2" />
    </svg>
  )
}

function IconCaja() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M10 2.6 17 6v8l-7 3.4L3 14V6z" strokeLinejoin="round" />
      <path d="M3 6l7 3.4L17 6M10 9.4v8" strokeLinejoin="round" />
    </svg>
  )
}
