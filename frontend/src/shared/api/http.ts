import axios from 'axios'
import { ApiError, type FieldError } from './ApiError'

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
    403: 'No tenés permisos para realizar esta operación.',
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
export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    timeout:15000,
    headers: {'Content-Type': 'application/json'}
})
http.interceptors.response.use(
    response => response,
    (error:unknown) => Promise.reject(toApiError(error)) 
);
http.interceptors.request.use(
    config => {
        const token = getToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);


/**Hasta que este creada la funcion del token pongo uno falso */
function getToken(): string | null {
    return localStorage.getItem("dev-token")
}
