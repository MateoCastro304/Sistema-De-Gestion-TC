import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { refresh } from '@/features/auth'
import type { SessionResponse, SessionUser } from '@/features/auth'
import { configureSession, setAccessToken } from '@/shared/api/http'
import { isApiError } from '@/shared/api/ApiError'
import type { ApiError } from '@/shared/api/ApiError'
import { SessionContext } from './SessionContext'
import type { Session } from './SessionContext'

export function SessionProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null)
    const [endMessage, setEndMessage] = useState<string | null>(null)
    // Hasta saber si hay sesión no se muestra nada (ni el ingreso).
    const [checking, setChecking] = useState(true)
    const started = useRef(false)

    // Abre la sesión: token en memoria y usuario vigente.
    const startSession = useCallback((response: SessionResponse) => {
        setAccessToken(response.accessToken)
        setUser(response.user)
        setEndMessage(null)
    }, [])

    // Cierra la sesión del lado del cliente. Solo SESSION_EXPIRED trae mensaje.
    const endSession = useCallback((error: ApiError) => {
        setAccessToken(null)
        setUser(null)
        setEndMessage(error.code === 'SESSION_EXPIRED' ? error.message : null)
    }, [])

    useEffect(() => {
        if (started.current) return
        started.current = true

        // Le enseña a http cómo renovar el token y qué hacer si la sesión termina.
        configureSession({
            refresh: async () => {
                const response = await refresh()
                startSession(response)
                return response.accessToken
            },
            onSessionEnd: endSession,
        })

        // Arranque: recupera la sesión con la cookie antes de decidir si va al ingreso.
        void refresh()
            .then(startSession)
            .catch((error: unknown) => {
                if (isApiError(error)) endSession(error)
            })
            .finally(() => setChecking(false))
    }, [startSession, endSession])

    const value = useMemo<Session>(
        () => ({ user, endMessage, startSession }),
        [user, endMessage, startSession],
    )

    if (checking) return null

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}