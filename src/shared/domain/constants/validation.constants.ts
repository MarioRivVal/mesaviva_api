export const PHONE_SPAIN_PATTERN = /^(\+34|0034)?[6789]\d{8}$/;
export const PHONE_SPAIN_MESSAGE =
  'El teléfono debe ser un número español válido (fijo o móvil)';

export const TIME_HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const TIME_HH_MM_MESSAGE = 'El formato debe ser HH:mm (formato 24h)';

export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*?\-_]).{8,}$/;
export const PASSWORD_MESSAGE =
  'Password must have min 8 chars, uppercase, lowercase, number and symbol';
