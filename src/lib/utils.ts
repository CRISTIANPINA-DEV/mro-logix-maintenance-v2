import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateSafely(date: Date | string | null, formatStr: string = 'yyyy-MM-dd'): string {
  if (!date) return "";
  
  // Convert string to Date if needed
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    return format(dateObj, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    
    // Fallback to basic format
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

/**
 * Parses a date string to a Date object without timezone shifting
 * Useful when working with date inputs that should be treated as local dates
 */
export function parseLocalDate(dateString: string | null): Date {
  if (!dateString) return new Date(); // Default to current date if null
  
  // Parse the date string (expected format: YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create a new date with the local timezone
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  
  return date;
}
