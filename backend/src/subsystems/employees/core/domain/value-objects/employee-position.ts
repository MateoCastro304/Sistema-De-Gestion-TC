export const EMPLOYEE_POSITIONS = ['ADMINISTRATION', 'WORKSHOP_HEAD', 'HEAD', 'EMPLOYEE'] as const;

export type EmployeePosition = (typeof EMPLOYEE_POSITIONS)[number];


export const EMPLOYEE_POSITION_LABELS: Record<EmployeePosition, string> = {
  ADMINISTRATION: 'Administración',
  WORKSHOP_HEAD: 'Jefe de taller',
  HEAD: 'Jefe',
  EMPLOYEE: 'Empleado',
};

export function isEmployeePosition(value: unknown): value is EmployeePosition {
  return typeof value === 'string' && (EMPLOYEE_POSITIONS as readonly string[]).includes(value);
}
