import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UserRepositoryPort } from '@modules/users/domain/ports/user.repository.port';
import { PasswordHasherPort } from '@shared/domain/ports/password-hasher.port';
import { seedSuperAdmin } from './superadmin.seed';

async function bootstrap() {
  console.log('🌱 Iniciando seeds...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  const userRepository = app.get(UserRepositoryPort);
  const passwordHasher = app.get(PasswordHasherPort);

  await seedSuperAdmin(userRepository, passwordHasher);

  await app.close();
  console.log('\n🌱 Seeds completados');
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Error en seeds:', error);
  process.exit(1);
});
