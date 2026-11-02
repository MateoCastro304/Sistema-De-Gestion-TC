import { Link } from 'react-router'
import { PageHero } from '@/shared/components/ui'
import { PANELS } from '@/features/catalogs/panels'

/**
 * Entrada de Empleados. Por ahora sólo trae el acceso al alta (CU-45);
 * el listado con búsqueda y dados de baja es DTC-201 (CU-47).
 */
export function EmployeesPage() {
  const { photo, photoPosition } = PANELS.administracion.items[0]

  return (
    <>
      <PageHero
        eyebrow="Personal de"
        accent="la empresa"
        title="Empleados"
        photo={photo}
        photoPosition={photoPosition}
        back={{ to: PANELS.administracion.to, label: PANELS.administracion.label }}
      />
      <div className="toolbar">
        <Link to="/administracion/empleados/nuevo" className="btn btn--primary toolbar__cta">
          + Nuevo empleado
        </Link>
      </div>
    </>
  )
}
