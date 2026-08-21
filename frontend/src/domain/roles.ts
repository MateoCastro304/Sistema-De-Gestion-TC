export const ROLES = {
    JT: 'Jefe de Taller',
    ERP: 'Encargado de Recepcion de Pedidos',
    EC: 'Encargado de Cotizaciones',
    AT: 'Administrativo Tecnico',
    A: 'Administrativo',
    ER: 'Encargado de Reportes',
    AS: 'Administrador del Sistema'
} as const
export type Role = keyof typeof ROLES
export function hasAnyRole(userRoles: Role[], roles: Role[]): boolean {
    return roles.some(role => userRoles.includes(role))
}