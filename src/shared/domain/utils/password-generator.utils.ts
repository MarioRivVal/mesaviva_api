export function generateTemporaryPassword(length = 12): string {
  const upp = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const low = 'abcdefghijkmnopqrstuvwxyz';
  const num = '23456789';
  const sym = '!@#$%&*?-_';
  const all = upp + low + num + sym;

  let pwd = '';
  pwd += upp[Math.floor(Math.random() * upp.length)];
  pwd += low[Math.floor(Math.random() * low.length)];
  pwd += num[Math.floor(Math.random() * num.length)];
  pwd += sym[Math.floor(Math.random() * sym.length)];

  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  return pwd
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
