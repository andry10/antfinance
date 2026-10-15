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
  if (!dateStr) return 'Semua';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const formatDateIndo = formatDate;

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

/**
 * Format string/number with thousand dots for Indonesian Rupiah input (e.g. 50000 -> "50.000")
 */
export const formatThousandInput = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
};

/**
 * Parse string with thousand dots to pure integer (e.g. "50.000" -> 50000)
 */
export const parseThousandInput = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Math.round(val);
  const clean = String(val).replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
};
export const getLocalDateStr = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
