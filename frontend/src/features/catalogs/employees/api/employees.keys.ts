/** Claves de React Query de Empleados: las mutaciones invalidan con las mismas. */
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: object) => [...employeeKeys.lists(), params] as const,
  // Cuelga de `lists()` para que el alta también refresque el encabezado.
  count: () => [...employeeKeys.lists(), 'count'] as const,
  detail: (id: number) => [...employeeKeys.all, 'detail', id] as const,
}
