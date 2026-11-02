/** Claves de React Query de Empleados: las mutaciones invalidan con las mismas. */
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  detail: (id: number) => [...employeeKeys.all, 'detail', id] as const,
}
