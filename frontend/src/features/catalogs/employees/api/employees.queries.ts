import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from './employees.keys'
import { createEmployee, getEmployee } from './employees.api'

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
