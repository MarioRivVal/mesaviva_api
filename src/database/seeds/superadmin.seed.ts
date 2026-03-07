import { UserRepositoryPort } from '@modules/users/domain/ports/user.repository.port';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';
import { User } from '@modules/users/domain/entities/user.entity';
import { UserRole } from '@modules/users/domain/enums/user-role.enum';

export async function seedSuperAdmin(
  userRepository: UserRepositoryPort,
  passwordHasher: PasswordHasherPort,
): Promise<void> {
  const email = 'mario.rivera@mesaviva.com';

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    console.log('⏭️  Superadmin ya existe, omitiendo...');
    return;
  }

  const passwordHash = await passwordHasher.hash('SuperAdmin123!');

  const superAdmin = User.create({
    id: crypto.randomUUID(),
    firstName: 'Super',
    lastName: 'Admin',
    phone: '600000000',
    email,
    passwordHash,
    role: UserRole.SUPERADMIN,
    mustChangePassword: false,
    isActive: true,
  });

  await userRepository.save(superAdmin);

  console.log('✅ Superadmin creado:');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: SuperAdmin123!`);
  console.log('   ⚠️  Cambia la password en producción');
}
