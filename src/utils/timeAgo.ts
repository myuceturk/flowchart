/**
 * Returns a human-readable relative time string ("3 dakika önce", "2 saat önce", etc.)
 * for a given timestamp (ms or ISO string). No external dependencies.
 */
export function timeAgo(input: number | string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return 'az önce';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'az önce';
  if (minutes < 60) return `${minutes} dakika önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days < 7) return `${days} gün önce`;
  if (weeks < 5) return `${weeks} hafta önce`;
  if (months < 12) return `${months} ay önce`;
  return `${years} yıl önce`;
}
