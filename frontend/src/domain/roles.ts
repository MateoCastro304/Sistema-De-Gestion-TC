/**
 * Business roles (RBAC) shared across the whole app.
 *

 * Note: a user can hold SEVERAL roles at once, so it is always modelled as
 * `Rol[]`, never a single `Rol`.
 */

export const ROLES = {
  JT: 'JT', // Jefe de Taller
  ERP: 'ERP', // Encargado de Recepción
  EC: 'EC', // Encargado de Cotización
  AT: 'AT', // Administrativo Técnico
  A: 'A', // Administrativo
  AS: 'AS', // Administrador del Sistema
  ER: 'ER', // Encargado de Reportes
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

/** Human-readable labels, for display in the UI (e.g. user profile). */
export const ROL_LABEL: Record<Rol, string> = {
  JT: 'Jefe de Taller',
  ERP: 'Encargado de Recepción',
  EC: 'Encargado de Cotización',
  AT: 'Administrativo Técnico',
  A: 'Administrativo',
  AS: 'Administrador del Sistema',
  ER: 'Encargado de Reportes',
};
