import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import { cn } from '@/shared/lib/cn'
import { useSession } from '@/app/providers/SessionContext'
import { canOpen } from '@/features/catalogs/panels'
import fotoHero from '@/assets/hero-castro.webp'
import logoBlanco from '@/assets/logo-castro-white.png'
import { useLogin } from '../api/auth.queries'
import { emptyLoginForm, loginFormSchema, toLoginRequest, type LoginFormValues } from '../schemas/login.schema'

/** Lo que deja el guard al mandar al ingreso: la pantalla que se quería abrir. */
interface LoginLocationState {
  from?: string
}

/**
 * Pantalla de ingreso (CU-53). Textos y estructura del prototipo: el panel
 * con la marca a la izquierda y el formulario "Ingresar" a la derecha.
 */
export function LoginPage() {
  const { user, endMessage, startSession } = useSession()
  const location = useLocation()
  const from = (location.state as LoginLocationState | null)?.from
  const login = useLogin()
  // El error del último intento. Tiene prioridad sobre el aviso de sesión expirada.
  const [failure, setFailure] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: emptyLoginForm,
  })

  // Con sesión: a la pantalla pedida si los roles la permiten, si no al inicio.
  if (user) {
    const target = from && canOpen(from, user.roles) ? from : '/'
    return <Navigate to={target} replace />
  }

  const submit = handleSubmit((values) => {
    setFailure(null)
    login.mutate(toLoginRequest(values), {
      onSuccess: startSession,
      onError: (error) => {
        // Conserva el usuario y limpia la contraseña (escenarios 2 y 3).
        resetField('password')
        if (isApiError(error) && error.code === 'VALIDATION_ERROR') {
          for (const detail of error.details) {
            if (detail.field === 'username' || detail.field === 'password') {
              setError(detail.field, { message: detail.message })
            }
          }
          return
        }
        // INVALID_CREDENTIALS y USER_BLOCKED traen el texto del contrato.
        setFailure(isApiError(error) ? error.message : 'Ocurrió un error inesperado.')
      },
    })
  })

  const notice = failure ?? endMessage

  return (
    <div className="login">
      <div className="login__hero" style={heroPhoto(fotoHero)}>
        <img className="login__logo" src={logoBlanco} alt="Castro Tornería S.R.L." />
        <div className="login__claim">
          <span className="login__eyebrow">
            Sistema de gestión <span className="login__eyebrow-accent">interno</span>
          </span>
          <span className="login__line" aria-hidden="true" />
          <h1 className="login__title">Transformando metales con precisión</h1>
          <p className="login__subtitle">Castro Tornería S.R.L. · Córdoba, desde 1977.</p>
        </div>
      </div>

      <div className="login__side">
        <form className="login__form" onSubmit={submit} noValidate>
          <div className="login__heading">
            <h2 className="login__form-title">Ingresar</h2>
            <span className="login__form-line" aria-hidden="true" />
          </div>

          {notice && (
            <div className={cn('login__alert', failure && 'login__alert--error')} role="alert">
              {notice}
            </div>
          )}

          <Input
            label="Nombre de usuario"
            placeholder="Ej: mrios"
            autoComplete="username"
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" block disabled={login.isPending}>
            Ingresar
          </Button>

          <p className="login__help">
            Si no recordás tu contraseña, pedile al Administrador del Sistema que la restablezca.
          </p>
        </form>
      </div>
    </div>
  )
}
