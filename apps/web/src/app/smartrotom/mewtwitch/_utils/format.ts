// Neither helper here has an equivalent in `lib/format`: `formatDuration` parses
// Twitch's "1h2m30s" strings, and `getTimeSince` renders Twitch-style English
// ("2m ago") that keeps counting in months/years instead of falling back to a date.
// `formatCompact` IS single-sourced — see `_utils/twitch.ts`'s `compactCount`.
export const formatDuration = (duration: string): string => {
  // Duration comes in format like "1h2m30s" or "2m30s" or "30s"
  const hours = duration.match(/(\d+)h/)?.[1] || '0';
  const minutes = duration.match(/(\d+)m/)?.[1] || '0';
  const seconds = duration.match(/(\d+)s/)?.[1] || '0';

  if (parseInt(hours) > 0) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.padStart(2, '0')}`;
};

export const getTimeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
};
