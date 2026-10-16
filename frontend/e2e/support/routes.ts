/**
 * Las URLs de la app que usan los tests, en un solo lugar.
 *
 * Las del Sprint 1 son las de `src/app/router/index.tsx`. Las del Sprint 2
 * todavía no existen: son la propuesta para cuando se hagan las pantallas
 * (siguen el patrón del Sprint 1 y los paneles del prototipo). Si al
 * implementarlas se elige otra URL, se cambia acá y los tests no se tocan.
 */
export const ROUTES = {
  // Sprint 1
  customersPanel: '/catalogos/clientes',
  managementPanel: '/catalogos/gestion',
  suppliers: '/catalogos/proveedores',
  newSupplier: '/catalogos/proveedores/nuevo',
  customers: '/catalogos/encargados',
  newCustomer: '/catalogos/encargados/nuevo',
  factories: '/catalogos/fabricas',
  newFactory: '/catalogos/fabricas/nuevo',
  categories: '/catalogos/rubros',

  // Sprint 2 (propuestas)
  login: '/ingresar',
  home: '/',
  administrationPanel: '/administracion',
  employees: '/administracion/empleados',
  newEmployee: '/administracion/empleados/nuevo',
  users: '/administracion/usuarios',
  newUser: '/administracion/usuarios/nuevo',
  processTypes: '/catalogos/tipos-de-proceso',
  newProcessType: '/catalogos/tipos-de-proceso/nuevo',
  materials: '/catalogos/materiales',
} as const

export const detail = {
  supplier: (id: number) => `${ROUTES.suppliers}/${id}`,
  customer: (factoryId: number, id: number) => `${ROUTES.customers}/${factoryId}/${id}`,
  factory: (id: number) => `${ROUTES.factories}/${id}`,
  employee: (id: number) => `${ROUTES.employees}/${id}`,
  user: (id: number) => `${ROUTES.users}/${id}`,
  processType: (id: number) => `${ROUTES.processTypes}/${id}`,
}
