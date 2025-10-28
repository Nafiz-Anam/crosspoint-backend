/**
 * Timezone utility functions for Italian timezone (Europe/Rome)
 */

const ITALY_TIMEZONE = "Europe/Rome";

/**
 * Get current date in Italian timezone
 * @returns Date object representing current date in Italian timezone
 */
export const getItalianDate = (): Date => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: ITALY_TIMEZONE })
  );
};

/**
 * Get today's date (midnight) in Italian timezone
 * @returns Date object at midnight (00:00:00) in Italian timezone
 */
export const getItalianToday = (): Date => {
  const date = getItalianDate();
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Format a date in Italian timezone
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatItalianDate = (
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  return date.toLocaleString("it-IT", {
    timeZone: ITALY_TIMEZONE,
    ...options,
  });
};

/**
 * Get a date at a specific hour in Italian timezone
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minutes (0-59, default 0)
 * @param second - Seconds (0-59, default 0)
 * @returns Date object at specified time in Italian timezone
 */
export const getItalianTime = (
  hour: number,
  minute: number = 0,
  second: number = 0
): Date => {
  const date = getItalianToday();
  date.setHours(hour, minute, second);
  return date;
};

/**
 * Check if current time in Italian timezone is after a specific time
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minutes (0-59, default 0)
 * @returns True if current Italian time is after the specified time
 */
export const isAfterItalianTime = (
  hour: number,
  minute: number = 0
): boolean => {
  const now = getItalianDate();
  const targetTime = getItalianTime(hour, minute);
  return now > targetTime;
};

export { ITALY_TIMEZONE };
