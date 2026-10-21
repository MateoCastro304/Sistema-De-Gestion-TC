import axios, { type InternalAxiosRequestConfig } from 'axios'
import { ApiError, isApiError, type FieldError } from './ApiError'

/** Cuerpo de error del backend. Campos opcionales por si el back cambia. */
interface NestErrorBody {
    statusCode?: number
    message?: string | string[]
    error?: string
    /** Código del contrato (Sprint 2). */
    code?: string
    /** Errores por campo (400 y 409 del Sprint 2). */
    details?: FieldError[]
    /** Forma vieja del Sprint 1 (proveedores). */
    field?: string
}

/** Mensajes para cuando el backend no manda ninguno. */
const FALLBACK_MESSAGES: Record<number, string> = {
    400: 'Los datos enviados no son válidos.',
    401: 'Tu sesión expiró. Volvé a iniciar sesión.',
    403: 'No tenés permiso para realizar esta acción.',
    404: 'No encontramos lo que buscabas.',
    409: 'Ese registro ya existe o está siendo utilizado.',
    422: 'Los datos enviados no son válidos.',
}

function fallbackMessage(status: number): string {
    return FALLBACK_MESSAGES[status] ?? (status >= 500 ? 'Error del servidor. Intentá de nuevo en unos minutos.'
        : 'Ocurrió un error inesperado.'
    )
}

function toApiError(error: unknown): ApiError {
    // Un error que no sea de axios: un bug nuestro
    if (!axios.isAxiosError<NestErrorBody | undefined>(error)) {
        return new ApiError(0, 'Ocurrió un error inesperado en la aplicación.')
    }

    // Backend caído, sin red, timeout
    if (!error.response) {
        const message = error.code === 'ECONNABORTED' ? 'El servidor tardó demasiado en responder. Intentá de nuevo en unos minutos.' : 'Error de red. Verificá tu conexión a internet.'
        return new ApiError(0, message)
    }

    const { status, data: body } = error.response
    const options = {
        code: body?.code,
        details: Array.isArray(body?.details) ? body.details : [],
        field: body?.field,
    }

    const rawMessage = body?.message
    if (Array.isArray(rawMessage) && rawMessage.length > 0) {
        return new ApiError(status, rawMessage[0], options)
    }
    if (typeof rawMessage === 'string' && rawMessage.trim() !== '') {
        return new ApiError(status, rawMessage, options)
    }
    return new ApiError(status, fallbackMessage(status), options)
}

// ── Sesión (contrato §4 "Sesión" y §8.4) ─────────────────────────────────

/** El accessToken vive solo en memoria, nunca en localStorage. */
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
    accessToken = token
}

/** Lo que la app le enseña a http para manejar la sesión. */
interface SessionHandlers {
    /** Pide un accessToken nuevo y lo devuelve. */
    refresh: () => Promise<string>
    /** La sesión terminó (SESSION_EXPIRED o UNAUTHENTICATED): ir al ingreso. */
    onSessionEnd: (error: ApiError) => void
}

let sessionHandlers: SessionHandlers | null = null

export function configureSession(handlers: SessionHandlers): void {
    sessionHandlers = handlers
}

/** Refresh en curso: si varias peticiones vencen a la vez, comparten uno solo. */
let refreshing: Promise<string> | null = null

function refreshOnce(refresh: () => Promise<string>): Promise<string> {
    refreshing ??= refresh().finally(() => {
        refreshing = null
    })
    return refreshing
}

/** Marca para no reintentar dos veces la misma petición. */
interface RetriableConfig extends InternalAxiosRequestConfig {
    retried?: boolean
}

/** Los errores de /auth los maneja quien llama (el ingreso, el arranque). */
function isSessionEndpoint(url: string | undefined): boolean {
    return url?.startsWith('/auth/') ?? false
}

// ── Cliente ──────────────────────────────────────────────────────────────

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(config => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
})

http.interceptors.response.use(
    response => response,
    async (error: unknown) => {
        const apiError = toApiError(error)
        const config = axios.isAxiosError(error) ? (error.config as RetriableConfig | undefined) : undefined

        if (!config || !sessionHandlers || isSessionEndpoint(config.url)) {
            throw apiError
        }

        // Token vencido: un solo refresh y se repite la petición
        if (apiError.code === 'ACCESS_TOKEN_EXPIRED' && !config.retried) {
            config.retried = true
            try {
                await refreshOnce(sessionHandlers.refresh)
            } catch (refreshError) {
                if (isApiError(refreshError)) sessionHandlers.onSessionEnd(refreshError)
                throw refreshError
            }
            return http(config)
        }

        // Sesión terminada: al ingreso
        if (apiError.code === 'SESSION_EXPIRED' || apiError.code === 'UNAUTHENTICATED') {
            sessionHandlers.onSessionEnd(apiError)
        }
        throw apiError
    },
)