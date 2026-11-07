import { Link, useNavigate } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoPrensa from '@/assets/foto-prensa.webp'
import { EmployeeForm } from '../components/EmployeeForm'

const LIST_PATH = '/administracion/empleados'

/** CU-45 Registrar empleado. Al terminar abre el detalle del empleado nuevo. */
export function NewEmployeePage() {
  const navigate = useNavigate()

  return (
    <>
      <div className="page-header page-header--foto" style={heroPhoto(fotoPrensa)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to={LIST_PATH} className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Empleados
            </Link>
            <div>
              <h1 className="page-header__title">Nuevo empleado</h1>
              <p className="page-header__subtitle">
                Los campos marcados con * son obligatorios. Después le podés crear un usuario.
              </p>
            </div>
          </div>
        </div>
      </div>

      <EmployeeForm
        onCreated={(employee) => void navigate(`${LIST_PATH}/${employee.id}`)}
        onCancel={() => void navigate(LIST_PATH)}
      />
    </>
  )
}
