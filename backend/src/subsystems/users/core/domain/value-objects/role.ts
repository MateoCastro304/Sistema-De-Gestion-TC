/**
 * RN44: catálogo cerrado de roles, igual a los actores internos del
 * dominio. No se administra desde el sistema. Un usuario puede tener
 * uno o varios.
 */
export const ROLES = ['JT', 'ERP', 'EC', 'ER', 'AT', 'AS'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
