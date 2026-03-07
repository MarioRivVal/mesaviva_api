import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = (config: ConfigService): JwtModuleOptions => {
  const secret = config.get<string>('JWT_SECRET');

  if (!secret) {
    throw new Error('JWT_SECRET must be defined in environment variables');
  }

  const expiresIn = parseInt(
    config.get<string>('JWT_EXPIRES_IN') ?? '86400',
    10,
  );

  return {
    secret,
    signOptions: {
      expiresIn,
    },
  };
};
