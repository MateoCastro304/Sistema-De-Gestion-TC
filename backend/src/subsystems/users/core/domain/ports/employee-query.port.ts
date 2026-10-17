/**
 * Puerto hacia el subsystem de Employee (todavía no existe en el proyecto —
 * mismo camino que FactoryQuery al principio de categories: el puerto se
 * define del lado de quien lo necesita, el adaptador real lo implementa
 * employees cuando exista).
 *
 * Devuelve el empleado exista o no, activo o no: CreateUser necesita
 * distinguir "no existe" (400 EMPLOYEE_NOT_FOUND) de "existe pero está
 * dado de baja" (422 EMPLOYEE_INACTIVE) — son dos códigos HTTP distintos
 * según el contrato, así que un solo booleano no alcanza.
 */
export type EmployeeSummary = {
  id: number;
  firstName: string;
  lastName: string;
  active: boolean;
};

export abstract class EmployeeQuery {
  abstract findEmployee(employeeId: number): Promise<EmployeeSummary | null>;
}
