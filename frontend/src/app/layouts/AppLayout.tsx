import { Fragment, useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { BreadcrumbContext } from '@/app/providers/BreadcrumbContext'
import { PANELS, panelOf } from '@/features/catalogs/panels'
import { cn } from '@/shared/lib/cn'
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

/**
 * El menú va agrupado y cada ítem es un panel de tarjetas, no un
 * listado: "Clientes" lleva a Encargados, Fábricas y Rubros; "Gestión",
 * a Proveedores. Un listado marca en el menú el panel del que cuelga.
 * Cotizaciones y Administración son del sprint 2: se suman acá como
 * grupos nuevos.
 */
const NAV_GROUPS = [
  {
    label: 'Catálogos',
    items: [
      { panel: PANELS.clientes, icon: IconFabrica },
      { panel: PANELS.gestion, icon: IconEngranaje },
    ],
  },
]

/** Un tramo de la miga de pan. Con `to` es un enlace. */
type Crumb = { label: string; to?: string }

/**
 * La miga de pan sale de la URL, como en el prototipo:
 *   panel    → CATÁLOGOS / CLIENTES
 *   listado  → CLIENTES / ENCARGADOS
 *   alta     → CLIENTES / ENCARGADOS / NUEVO
 *   detalle  → CLIENTES / ENCARGADOS / Laura Gómez
 * El nombre del detalle lo publica la pantalla (useCrumbTitle).
 */
function breadcrumb(pathname: string, title: string | null): Crumb[] {
  const panel = panelOf(pathname)
  if (!panel) return [{ label: 'Sistema' }, { label: 'Página no encontrada' }]
  if (pathname === panel.to) return [{ label: 'Catálogos' }, { label: panel.label }]

  const item = panel.items.find((i) => pathname === i.to || pathname.startsWith(i.to + '/'))
  if (!item || pathname === item.to) return [{ label: panel.label }, { label: item?.label ?? '' }]

  const last = pathname.endsWith('/nuevo') ? 'Nuevo' : title
  return [
    { label: panel.label },
    { label: item.label, to: item.to },
    ...(last ? [{ label: last }] : []),
  ]
}

export function AppLayout() {
  const { pathname } = useLocation()
  const activePanel = panelOf(pathname)

  /** Nombre del registro abierto, para la miga de pan (ver BreadcrumbContext). */
  const [crumbTitle, setCrumbTitle] = useState<string | null>(null)
  const crumbs = breadcrumb(pathname, crumbTitle)

  /** Escritorio: barra ancha o riel de íconos. */
  const [collapsed, setCollapsed] = useState(false)
  /** Celular: cajón abierto o cerrado. */
  const [drawerOpen, setDrawerOpen] = useState(false)

  /* Al navegar el cajón se cierra solo (ver el onClick de los
     Link del menú más abajo). Se hace en el evento y no en un useEffect
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
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="sidebar__section">
              <span className="sidebar__section-label">{group.label}</span>
              <ul className="sidebar__list">
                {group.items.map(({ panel, icon: Icon }) => (
                  <li key={panel.to}>
                    <Link
                      to={panel.to}
                      /* El title es lo que queda cuando la barra está
                         colapsada y sólo se ve el ícono. */
                      title={panel.label}
                      /* En celular, entrar a una sección cierra el
                         cajón; en escritorio no hay cajón abierto, así
                         que esto no hace nada. */
                      onClick={() => setDrawerOpen(false)}
                      /* Activo también dentro de sus listados: en
                         Encargados queda marcado "Clientes". */
                      aria-current={activePanel === panel ? 'page' : undefined}
                      className={cn('sidebar__link', activePanel === panel && 'sidebar__link--active')}
                    >
                      <Icon />
                      {/* El span es necesario: el CSS lo esconde en modo
                          riel sin tocar el ícono. */}
                      <span className="sidebar__link-text">{panel.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
          <nav className="topbar__breadcrumb" aria-label="Estás en">
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1
              return (
                <Fragment key={i}>
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {crumb.to ? (
                    <Link to={crumb.to} className="topbar__breadcrumb-link">{crumb.label}</Link>
                  ) : (
                    <span className={last ? 'topbar__breadcrumb-item--current' : undefined}>{crumb.label}</span>
                  )}
                </Fragment>
              )
            })}
          </nav>
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
          <BreadcrumbContext.Provider value={setCrumbTitle}>
            <Outlet />
          </BreadcrumbContext.Provider>
        </div>
      </div>
    </div>
  )
}


/* ---- Íconos ----
   Inline y con stroke="currentColor" para que tomen el color del
   estado (claro normal, azul en el activo) sin CSS extra. Están
   declarados con `function` (no const) para poder referenciarlos
   desde NAV_GROUPS, que está más arriba en el archivo. Son los mismos
   trazos del prototipo: Clientes usa la fábrica; Gestión, el engranaje. */

function IconFabrica() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17V8.5l4.5 3V8.5l4.5 3V5h5v12z" />
    </svg>
  )
}

function IconEngranaje() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 7a3 3 0 1 1 0 6a3 3 0 1 1 0-6M10 2.5V5M10 15v2.5M2.5 10H5M15 10h2.5M4.7 4.7l1.8 1.8M13.5 13.5l1.8 1.8M4.7 15.3l1.8-1.8M13.5 6.5l1.8-1.8" />
    </svg>
  )
}
