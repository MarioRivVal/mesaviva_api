import { Module } from '@nestjs/common';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher.service';
import { PasswordHasherPort } from './domain/ports/password-hasher.port';

@Module({
  providers: [
    {
      provide: PasswordHasherPort,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [PasswordHasherPort],
})
export class SharedModule {}
