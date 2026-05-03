import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string'
    ? new Date(date.includes('T') ? date : date + 'T12:00:00Z')
    : date
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function getInitials(name: string) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
