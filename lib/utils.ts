import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return price.toFixed(2)
}

export function getPriceColor(price: number): string {
  if (price < 5) return "text-green-600"
  if (price < 10) return "text-yellow-600"
  return "text-red-600"
}

export function getPriceBgColor(price: number): string {
  if (price < 5) return "bg-green-100 dark:bg-green-900/30"
  if (price < 10) return "bg-yellow-100 dark:bg-yellow-900/30"
  return "bg-red-100 dark:bg-red-900/30"
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("fi-FI", { day: "numeric", month: "short" })
}
