import { useState } from 'react'
import { useSession } from '@/app/providers/SessionContext'
import { useToast } from '@/app/providers/ToastContext'
import { ROL_LABEL } from '@/domain/roles'
import { isApiError } from '@/shared/api/ApiError'
import { Avatar, Badge, Button, Modal } from '@/shared/components/ui'

/** Menú de usuario de la topbar (CU-52). `dirty`: la pantalla tiene datos sin guardar. */
export function UserMenu({ dirty }: { dirty: boolean }) {
  const { user, logout } = useSession()
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [closing, setClosing] = useState(false)

  if (!user) return null
  const fullName = `${user.employee.firstName} ${user.employee.lastName}`

  const closeSession = async () => {
    setClosing(true)
    try {
      await logout()
    } catch (error) {
      // La sesión sigue abierta (por ejemplo, sin red): se avisa.
      setClosing(false)
      setConfirming(false)
      showToast('error', isApiError(error) ? error.message : 'Ocurrió un error inesperado.')
    }
  }

  // Con datos sin guardar pide confirmación; si no, cierra directo.
  const requestClose = () => {
    setOpen(false)
    if (dirty) setConfirming(true)
    else void closeSession()
  }

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        <Avatar name={fullName} shape="round" />
      </button>

      {open && (
        <>
          {/* Fondo transparente: tocar afuera cierra el menú. */}
          <button
            type="button"
            className="user-menu__scrim"
            aria-label="Cerrar el menú de usuario"
            onClick={() => setOpen(false)}
          />
          <div className="user-menu__panel">
            <div className="user-menu__who">
              <Avatar name={fullName} shape="round" />
              <span className="user-menu__text">
                <b>{fullName}</b>
                <span>Usuario {user.username}</span>
              </span>
            </div>
            <div className="user-menu__roles">
              {user.roles.map((rol) => (
                <Badge key={rol}>{ROL_LABEL[rol]}</Badge>
              ))}
            </div>
            <button type="button" className="user-menu__action" onClick={requestClose}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Cerrar sesión"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Seguir acá
            </Button>
            <Button variant="danger" onClick={() => void closeSession()} disabled={closing}>
              Cerrar sesión
            </Button>
          </>
        }
      >
        <p>Se van a perder los datos que no guardaste.</p>
      </Modal>
    </div>
  )
}
