import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { EntityIcon, PageHero } from '@/shared/components/ui'
import { PANELS, type PanelKey } from '../panels'

interface PanelPageProps {
  panel: PanelKey
}

/**
 * Panel de tarjetas ("Clientes", "Gestión"): la cabecera del catálogo y
 * una tarjeta con foto por cada listado que agrupa. Es sólo navegación:
 * no pide datos.
 */
export function PanelPage({ panel }: PanelPageProps) {
  const { label, eyebrow, accent, description, photo, photoPosition, items } = PANELS[panel]

  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        accent={accent}
        title={label}
        photo={photo}
        photoPosition={photoPosition}
        variant="panel"
      >
        {description}
      </PageHero>

      <div className="panel-grid">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="panel-card"
            style={{ '--card-foto': `url(${item.photo})`, '--card-pos': item.photoPosition } as CSSProperties}
          >
            <span className="panel-card__photo">
              <span className="panel-card__icon">
                <EntityIcon name={item.icon} />
              </span>
            </span>
            <span className="panel-card__body">
              <span className="panel-card__title">{item.label}</span>
              <span className="panel-card__line" aria-hidden="true" />
              <span className="panel-card__text">{item.description}</span>
              <span className="panel-card__cta">
                Ingresar
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7.5 4.5 13 10l-5.5 5.5" />
                </svg>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
