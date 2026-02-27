import { UserRole } from '@modules/users/domain/enums/user-role.enum';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    mustChangePassword: boolean;
  };
}
