import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date string from HTML date input (YYYY-MM-DD) as a local date
 * without timezone conversion issues. This prevents date shifting when
 * the date is stored/retrieved from the database.
 */
export function parseLocalDate(dateString: string): Date {
  // Split the date string and create a Date object using local timezone
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
}

/**
 * Format a date for display, handling potential timezone issues gracefully.
 * This ensures consistent date display regardless of how the date was stored.
 */
export function formatDateSafely(
  date: string | Date,
  formatStr: string = "MMM dd, yyyy"
): string {
  try {
    let dateObj: Date;

    if (typeof date === "string") {
      // If it's a string, try to parse it safely
      if (date.includes("T")) {
        // If it has time component, use as-is
        dateObj = new Date(date);
      } else {
        // If it's just a date string (YYYY-MM-DD), parse as local date
        dateObj = parseLocalDate(date);
      }
    } else {
      dateObj = date;
    }

    // Use date-fns format
    return format(dateObj, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Generates a random 8-digit PIN
 * @returns A string containing an 8-digit PIN
 */
export function generatePin(): string {
  // Generate a random number between 10000000 and 99999999
  const pin = Math.floor(10000000 + Math.random() * 90000000);
  return pin.toString();
}
