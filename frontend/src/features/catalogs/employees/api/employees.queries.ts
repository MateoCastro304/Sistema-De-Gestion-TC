import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EmployeeListParams } from '../types/employee'
import { employeeKeys } from './employees.keys'
import { countEmployees, createEmployee, getEmployee, listEmployees } from './employees.api'

/** CU-47 Listado de empleados con búsqueda, dados de baja y página. */
export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployees(params),
    placeholderData: keepPreviousData,
  })
}

/** Cantidad de empleados activos del encabezado. */
export function useEmployeesCount() {
  return useQuery({
    queryKey: employeeKeys.count(),
    queryFn: countEmployees,
  })
}

/** Un empleado por id. */
export function useEmployee(id: number) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => getEmployee(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/** CU-45 Registrar empleado. */
export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: (employee) => {
      // El detalle que se abre a continuación sale de la caché.
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee)
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
