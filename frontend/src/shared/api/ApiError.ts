
/** Error de un campo, como lo informa la API (contrato §5.2). */
export interface FieldError {
    field: string;
    message: string;
}

interface ApiErrorOptions {
    /** Código del catálogo del contrato (§5.3). */
    code?: string;
    /** Errores por campo (400 de validación, 409 de unicidad). */
    details?: FieldError[];
    /** Forma vieja del Sprint 1 (proveedores). */
    field?: string;
}

/**
 * Error normalizado de la API. Todo lo que sale de http.ts es una
 * instancia de esto, así ninguna página tiene que conocer axios.
 */
export class ApiError extends Error {
    readonly status: number;
    /** Código del contrato (Sprint 2): la pantalla decide por esto, no por el texto. */
    readonly code?: string;
    readonly details: FieldError[];
    /** Campo que causó el error, si el backend lo informa (ej: un 409). */
    readonly field?: string;

    constructor(status: number, message: string, { code, details = [], field }: ApiErrorOptions = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.field = field;
    }

    /** Choque con una regla de negocio. Ej: el CUIT ya está registrado. */
    get isConflict(): boolean {
        return this.status === 409;
    }

    get isNotFound(): boolean {
        return this.status === 404;
    }

    /** 0 = no hubo respuesta (backend caído, sin red, timeout). */
    get isNetworkError(): boolean {
        return this.status === 0;
    }

    /** Datos inválidos. Suele haber algo útil en `details`. */
    get isValidation(): boolean {
        return this.status === 422 || this.status === 400;
    }

    get isAuth(): boolean {
        return this.status === 401 || this.status === 403;
    }

    /** Reventó el backend */
    get isServer(): boolean {
        return this.status >= 500;
    }
}

/** Type guard para los catch: confirma que el error es un ApiError. */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}