import { createContext, useContext } from 'react'
import type { SessionResponse, SessionUser } from '@/features/auth'

/** Lo que cualquier pantalla puede saber y hacer con la sesión. */
export interface Session {
    /** El usuario que ingresó, o null si no hay sesión. */
    user: SessionUser | null
    /** Por qué terminó la sesión, para mostrarlo en el ingreso ("Tu sesión expiró por inactividad"). */
    endMessage: string | null
    /** Guarda la sesión que devolvió el login. */
    startSession: (response: SessionResponse) => void
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
    const session = useContext(SessionContext)
    if (session === null) throw new Error('useSession() must be used inside <SessionProvider>')
    return session
}