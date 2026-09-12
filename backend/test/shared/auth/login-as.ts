// const cache: Partial<Record<Role, { Authorization: string }>> = {};

// export async function loginAs(role: Role) {
//   if (!cache[role]) {
//     const token = signTestToken({ sub: `test-${role}`, role }); // mismo secret que AuthModule
//     cache[role] = { Authorization: `Bearer ${token}` };
//   }
//   return cache[role]!;
// }
