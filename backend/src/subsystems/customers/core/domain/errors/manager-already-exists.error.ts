export class ManagerAlreadyExists extends Error {
  constructor(public readonly mail: string) {
    super(`Manager with mail "${mail}" already exists`);
    this.name = 'ManagerAlreadyExists';
  }
}
