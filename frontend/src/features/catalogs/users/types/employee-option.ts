/**
 * Un empleado tal como lo usa el buscador "Empleado" del alta de usuario
 * (CU-05). Es un recorte de `GET /employees` (contrato del Sprint 2, §3.2):
 * sólo los campos que muestra la opción y los que deciden si se puede elegir.
 *
 * Está acá y no se importa de la feature Empleados porque ésta todavía no
 * exporta nada de su API. Cuando lo haga, se puede reemplazar.
 */
export interface EmployeeOption {
  id: number
  firstName: string
  lastName: string
  /** `false` si fue dado de baja. El listado sin `includeInactive` no los trae. */
  active: boolean
  /** Su usuario, si ya tiene: la opción muestra "Ya tiene usuario". */
  user: { id: number; username: string } | null
}
