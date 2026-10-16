/**
 * Business roles (RBAC) shared across the whole app.
 *
 * Es el enumerado cerrado `Role` del contrato del Sprint 2
 * (`docs/api-contract/API_CONTRACT_SPRINT_2.md`, §2 y D-11): seis roles, ni
 * más ni menos. Se corresponden con los actores internos del sistema y no se
 * administran (RN44).
 *
 * Note: a user can hold SEVERAL roles at once, so it is always modelled as
 * `Rol[]`, never a single `Rol`. Sus permisos son la suma de los de cada rol.
 */

export const ROLES = {
  JT: 'JT', // Jefe de Taller
  ERP: 'ERP', // Encargado de Recepción
  EC: 'EC', // Encargado de Cotización
  ER: 'ER', // Encargado de Reportes
  AT: 'AT', // Administrativo Técnico
  AS: 'AS', // Administrador del Sistema
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

/**
 * El orden del contrato (el del prototipo). Las listas de roles que devuelve la
 * API vienen siempre así, y así se muestran en los desplegables.
 */
export const ROLE_ORDER: Rol[] = ['JT', 'ERP', 'EC', 'ER', 'AT', 'AS'];

/** Human-readable labels, for display in the UI (e.g. user profile). */
export const ROL_LABEL: Record<Rol, string> = {
  JT: 'Jefe de Taller',
  ERP: 'Encargado de Recepción',
  EC: 'Encargado de Cotización',
  ER: 'Encargado de Reportes',
  AT: 'Administrativo Técnico',
  AS: 'Administrador del Sistema',
};

/** La descripción que muestra el prototipo al asignar roles (contrato §2). */
export const ROL_DESCRIPTION: Record<Rol, string> = {
  JT: 'Coordina y supervisa las órdenes de trabajo en el taller. No ve precios ni costos.',
  ERP: 'Registra las solicitudes de cotización y mantiene clientes, fábricas y rubros.',
  EC: 'Elabora y administra las cotizaciones solicitadas por los clientes. Incluye los permisos del Administrativo Técnico.',
  ER: 'Obtiene información estadística y gerencial de la actividad.',
  AT: 'Administra los catálogos de materiales, tipos de proceso y proveedores.',
  AS: 'Gestiona empleados y usuarios, y asigna sus roles.',
};

/**
 * Matriz de permisos del contrato ("Matriz por recurso", §4): qué roles
 * operan cada módulo, para leer y para escribir. Alcanza con tener uno. El
 * Encargado de Cotización hereda los permisos del Administrativo Técnico
 * (D-12); el Jefe de Taller y el Encargado de Reportes todavía no tienen
 * ningún módulo.
 */
export const MODULE_ROLES = {
  // Sprint 1
  customers: ['ERP'],
  factories: ['ERP'],
  categories: ['ERP'],
  suppliers: ['AT', 'EC'],
  // Sprint 2
  employees: ['AS'],
  users: ['AS'],
  processTypes: ['AT', 'EC'],
  materials: ['AT', 'EC'],
} as const satisfies Record<string, readonly Rol[]>;

export type AppModule = keyof typeof MODULE_ROLES;

/** True if the user holds at least one of the given roles. Used by router guards. */
export function hasAnyRole(userRoles: readonly Rol[], roles: readonly Rol[]): boolean {
  return roles.some((role) => userRoles.includes(role));
}

/** True if the user can use that module (contract permission matrix). */
export function canAccess(userRoles: readonly Rol[], module: AppModule): boolean {
  return hasAnyRole(userRoles, MODULE_ROLES[module]);
}
