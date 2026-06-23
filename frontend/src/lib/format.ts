export function timeAgo(date?: string): string {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units: [string, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${name}${val > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function deadlineLabel(hoursToDeadline?: number | null): string | null {
  if (hoursToDeadline == null) return null;
  const overdue = hoursToDeadline < 0;
  let h = Math.abs(hoursToDeadline);
  const days = Math.floor(h / 24);
  h = Math.round(h % 24);
  const parts = [days ? `${days}d` : null, `${h}h`].filter(Boolean).join(' ');
  return overdue ? `overdue by ${parts}` : `${parts} left`;
}

export function money(n: number, currency = '₹'): string {
  return `${currency}${(n || 0).toLocaleString('en-IN')}`;
}

export function shortDate(d?: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
