export const USER_STATUSES = ['ACTIVE', 'BLOCKED', 'INACTIVE'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];


export function computeUserStatus(state: { active: boolean; blocked: boolean }): UserStatus {
  if (!state.active) return 'INACTIVE';
  if (state.blocked) return 'BLOCKED';
  return 'ACTIVE';
}
