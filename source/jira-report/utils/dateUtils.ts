/**
 * Date utility functions for parsing Jira dates
 */

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get month name from date
 */
export function getMonthName(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Get quarter from date (Q1, Q2, Q3, Q4)
 */
export function getQuarter(date: Date): string {
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

/**
 * Get year from date
 */
export function getYear(date: Date): number {
  return date.getFullYear();
}
