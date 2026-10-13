export const formatRupiah = (num: number): string => {
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  return num.toLocaleString('id-ID');
};

export const formatDateTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const formatDurationMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.floor(minutes % 60);
  if (hours > 0) {
    return `${hours} Jam ${remainingMins} Mnt`;
  }
  return `${remainingMins} Mnt`;
};

export const formatSecondsToHms = (totalSeconds: number): string => {
  const absSec = Math.abs(Math.floor(totalSeconds));
  const h = Math.floor(absSec / 3600);
  const m = Math.floor((absSec % 3600) / 60);
  const s = absSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
