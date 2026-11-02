import { http } from '@/shared/api/http'
import type { Employee, EmployeeCreate } from '../types/employee'

/** Llamadas HTTP de Empleados (contrato del Sprint 2, §3.2). Sólo `AS`. */

const EMPLOYEES = '/employees'

/** CU-45 Registrar empleado: `201` con `active: true` y `user: null`. */
export async function createEmployee(input: EmployeeCreate): Promise<Employee> {
  const { data } = await http.post<Employee>(EMPLOYEES, input)
  return data
}

/** Detalle de un empleado, también si está dado de baja. */
export async function getEmployee(id: number): Promise<Employee> {
  const { data } = await http.get<Employee>(`${EMPLOYEES}/${id}`)
  return data
}
