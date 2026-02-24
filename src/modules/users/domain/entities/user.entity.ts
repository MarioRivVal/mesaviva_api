import { UserRole } from '../enums/user-role.enum';

export class User {
  constructor(
    public readonly id: string,
    public firstName: string,
    public lastName: string,
    public phone: string,
    public readonly email: string,
    public passwordHash: string,
    public readonly role: UserRole,
    public mustChangePassword: boolean,
    public isActive: boolean,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  toggleIsActive(): void {
    this.isActive = !this.isActive;
  }
}
