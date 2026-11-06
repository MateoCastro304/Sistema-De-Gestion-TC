import { Modal } from '@/shared/components/ui'
import type { Employee } from '../types/employee'
import { EmployeeForm } from './EmployeeForm'

interface EmployeeFormModalProps {
  open: boolean
  onClose: () => void
  /** El empleado registrado, para que el formulario de usuario lo deje elegido. */
  onCreated: (employee: Employee) => void
  /** Aviso de éxito; por defecto el del alta común. */
  successMessage?: string
}

/**
 * "+ Registrar empleado" del alta de usuario (CU-45, escenario 7): el mismo
 * formulario en una ventana, sin salir de la pantalla de usuario para no
 * perder lo que ya se cargó. Si se cierra, el formulario se desmonta y vuelve vacío.
 */
export function EmployeeFormModal({ open, onClose, onCreated, successMessage }: EmployeeFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Registrar empleado" size="lg">
      <p>Los campos marcados con * son obligatorios. Al registrarlo queda elegido para este usuario.</p>
      <EmployeeForm
        bare
        successMessage={successMessage}
        onCreated={(employee) => {
          onCreated(employee)
          onClose()
        }}
        onCancel={onClose}
      />
    </Modal>
  )
}
