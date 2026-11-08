/**
 * Rol de un usuario (Role.yaml, RN44). Catálogo cerrado: no se administra desde
 * la API. Está sembrado en la migración (`role.code`) y este arreglo tiene que
 * mantenerse igual, en el mismo orden que `role.sort_order` (el del prototipo).
 */
export const ROLES = ['JT', 'ERP', 'EC', 'ER', 'AT', 'AS'] as const;

export type Role = (typeof ROLES)[number];
