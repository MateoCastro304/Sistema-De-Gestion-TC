// Puerta de entrada de la feature Empleados: lo único que se usa desde afuera.
export { EmployeesPage } from './pages/EmployeesPage'
export { NewEmployeePage } from './pages/NewEmployeePage'
export { EmployeeDetailPage } from './pages/EmployeeDetailPage'
// "+ Registrar empleado" del alta de usuario (CU-45, escenario 7).
export { EmployeeFormModal } from './components/EmployeeFormModal'

export type { Employee, EmployeeCreate } from './types/employee'
