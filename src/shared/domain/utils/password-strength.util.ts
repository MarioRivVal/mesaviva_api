import { BadRequestError } from '@shared/domain/errors/domain.errors';

export function validatePasswordStrength(password: string): void {
  const errors: string[] = [];

  if (password.length < 8) errors.push('minimum 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('at least one number');
  if (!/[!@#$%&*?\-_]/.test(password))
    errors.push('at least one symbol (!@#$%&*?-_)');

  if (errors.length > 0) {
    throw new BadRequestError(
      `Password does not meet requirements: ${errors.join(', ')}`,
    );
  }
}
