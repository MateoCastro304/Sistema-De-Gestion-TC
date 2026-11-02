import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type { Employee, EmployeeCreate, EmployeeListParams } from '../types/employee'

/** Llamadas HTTP de Empleados (contrato del Sprint 2, §3.2). Sólo `AS`. */

const EMPLOYEES = '/employees'

/** CU-47 Consultar empleados: página de empleados, ordenados por apellido y nombre. */
export async function listEmployees(params?: EmployeeListParams): Promise<Page<Employee>> {
  const { data } = await http.get<Page<Employee>>(EMPLOYEES, { params })
  return data
}

/** Cantidad de empleados activos para el encabezado: `limit=1` sin filtros y se toma `total`. */
export async function countEmployees(): Promise<number> {
  const { total } = await listEmployees({ page: 1, limit: 1 })
  return total
}

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
