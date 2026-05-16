export function shortToLongUUID(shortUUID: string) {
  if (shortUUID.length !== 32) {
    throw new Error('Invalid short UUID length');
  }

  const parts = [
    shortUUID.substring(0, 8),
    shortUUID.substring(8, 12),
    shortUUID.substring(12, 16),
    shortUUID.substring(16, 20),
    shortUUID.substring(20, 32),
  ];

  return parts.join('-');
}

export function firstLetterToUpperCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomString(length: number) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatDate(fecha: any): string {
  const date = new Date(fecha);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
