import { User } from '../entities/user.entity';

export abstract class UserRepositoryPort {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByEmailWithPassword(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findAllRestaurantAdmins(): Promise<User[]>;
  abstract save(user: User): Promise<User>;
  abstract delete(id: string): Promise<void>;
}
