/** Motivo por el que se cerró una sesión (coincide con `session_end_reason_enum`). */
export const SESSION_END_REASONS = ['MANUAL', 'INACTIVITY', 'EXPIRED', 'REVOKED'] as const;

export type SessionEndReason = (typeof SESSION_END_REASONS)[number];
