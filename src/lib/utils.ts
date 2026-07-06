import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Released: 'plm-badge-success',
    Approved: 'plm-badge-success',
    Completed: 'plm-badge-success',
    'In Progress': 'plm-badge-info',
    'In Review': 'plm-badge-info',
    Active: 'plm-badge-info',
    Draft: 'plm-badge-neutral',
    Pending: 'plm-badge-warning',
    'Under Review': 'plm-badge-warning',
    Rejected: 'plm-badge-danger',
    Overdue: 'plm-badge-danger',
    Critical: 'plm-badge-danger',
  };
  return colors[status] || 'plm-badge-neutral';
}
