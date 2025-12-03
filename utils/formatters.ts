/**
 * Utility functions for formatting data display
 */

/**
 * Format currency to Indian Rupee format
 * @param amount - Amount to format
 * @param showSymbol - Whether to show ₹ symbol
 */
export function formatCurrency(amount: number | string | undefined, showSymbol: boolean = true): string {
  if (amount === undefined || amount === null) return showSymbol ? '₹0.00' : '0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return showSymbol ? '₹0.00' : '0.00';
  
  const formatted = numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format date to readable format
 * @param date - Date string or Date object
 * @param format - Format type: 'short', 'long', 'relative'
 */
export function formatDate(
  date: string | Date | undefined,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  switch (format) {
    case 'short':
      // dd MMM yyyy (e.g., 15 Dec 2024)
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    
    case 'long':
      // dd MMMM yyyy (e.g., 15 December 2024)
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    
    case 'relative':
      // "2 days ago", "in 3 days"
      return getRelativeTime(dateObj);
    
    default:
      return dateObj.toLocaleDateString('en-IN');
  }
}

/**
 * Format date and time together
 * @param date - Date string or Date object
 */
export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const isPast = diffMs < 0;
  const absDays = Math.abs(diffDays);
  const absHours = Math.abs(diffHours);
  const absMins = Math.abs(diffMins);
  
  if (absDays > 7) {
    return formatDate(date, 'short');
  } else if (absDays >= 1) {
    return isPast ? `${absDays} day${absDays > 1 ? 's' : ''} ago` : `in ${absDays} day${absDays > 1 ? 's' : ''}`;
  } else if (absHours >= 1) {
    return isPast ? `${absHours} hour${absHours > 1 ? 's' : ''} ago` : `in ${absHours} hour${absHours > 1 ? 's' : ''}`;
  } else if (absMins >= 1) {
    return isPast ? `${absMins} min${absMins > 1 ? 's' : ''} ago` : `in ${absMins} min${absMins > 1 ? 's' : ''}`;
  } else {
    return 'Just now';
  }
}

/**
 * Format phone number to Indian format
 * @param phone - Phone number string
 */
export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return 'N/A';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +91 XXXXX XXXXX or XXXXX-XXXXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places
 */
export function formatPercentage(value: number | undefined, decimals: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 */
export function truncateText(text: string | undefined, maxLength: number = 50): string {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 */
export function capitalizeWords(text: string | undefined): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format status badge text
 * @param status - Status string
 */
export function formatStatus(status: string | undefined): string {
  if (!status) return 'Unknown';
  
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Parse ISO date to Date object safely
 * @param dateString - ISO date string
 */
export function parseDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if date is today
 * @param date - Date to check
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 * @param date - Date to check
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Get days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
