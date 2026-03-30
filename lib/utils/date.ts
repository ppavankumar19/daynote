export function previousDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d - 1);
  return date.toISOString().slice(0, 10);
}

export function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + 1);
  return date.toISOString().slice(0, 10);
}

export function isFuture(iso: string): boolean {
  return iso > new Date().toISOString().slice(0, 10);
}

export function isValidDateISO(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}
