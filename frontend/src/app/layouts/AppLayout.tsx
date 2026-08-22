import { Outlet, NavLink } from 'react-router'

export function AppLayout() {
  return (
    <div className="app">

      <aside className="sidebar">
        {/* marca arriba de todo */}
        <div className="sidebar__brand">
          <div className="sidebar__logo">TC</div>
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">Tornería Castro</span>
            <span className="sidebar__brand-sub">Sistema de gestión</span>
          </div>
        </div>

        {/* la navegación */}
        <nav className="sidebar__nav">
          <div className="sidebar__section">
            <span className="sidebar__section-label">Administración</span>
            <ul className="sidebar__list">
              <li>
                <NavLink to="/catalogs/suppliers" className={({ isActive }) => isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                    }
                    >
                    Proveedores
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__breadcrumb">
            <span className="topbar__breadcrumb-item--current">Proveedores</span>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </div>

    </div>
  )
}