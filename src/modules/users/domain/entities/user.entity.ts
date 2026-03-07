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

  static create(params: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    mustChangePassword: boolean;
    isActive: boolean;
  }): User {
    return new User(
      params.id,
      params.firstName,
      params.lastName,
      params.phone,
      params.email,
      params.passwordHash,
      params.role,
      params.mustChangePassword,
      params.isActive,
    );
  }

  toggleIsActive(): void {
    this.isActive = !this.isActive;
  }
}
