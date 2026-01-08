/**
 * Time Helpers - Local Machine Time Utilities
 * 
 * Application-instruction Rule 4: Any updates about time MUST use local machine time
 * NEVER use server time or UTC time for user-facing updates
 * 
 * These functions ensure all time displays use the user's local timezone.
 */

/**
 * Format date and time in local timezone
 * @param date - Date object to format
 * @returns Formatted date/time string in local timezone (e.g., "2026-01-08 10:52:39")
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Format date only in local timezone
 * @param date - Date object to format
 * @returns Formatted date string in local timezone (e.g., "2026-01-08")
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Get ISO-like string in local timezone (not UTC)
 * @param date - Date object to format
 * @returns ISO-like string in local timezone (e.g., "2026-01-08T10:52:39")
 */
export function getLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Format date/time with custom format in local timezone
 * @param date - Date object to format
 * @param format - Format string (e.g., "YYYY-MM-DD HH:mm:ss")
 * @returns Formatted string
 */
export function formatLocalDateTimeCustom(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}
