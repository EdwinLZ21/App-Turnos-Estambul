/**
 * Utility functions for date and time handling in the shift management system
 */

export class DateUtils {
  /**
   * Get current time rounded to nearest 15 minutes (down if <15, up if >=15)
   * If minutes are 0-14, round down to hour. If 15-29, round to :15. If 30-44, round to :30. If 45-59, round up to next hour.
   */
  static getRoundedCurrentTime(): string {
    const now = new Date()
    let hours = now.getHours()
    let minutes = now.getMinutes()
    let roundedMinutes = 0
    if (minutes < 15) {
      roundedMinutes = 0
    } else if (minutes < 30) {
      roundedMinutes = 15
    } else if (minutes < 45) {
      roundedMinutes = 30
    } else {
      roundedMinutes = 0
      hours += 1
      if (hours === 24) hours = 0
    }
    const hh = hours.toString().padStart(2, "0")
    const mm = roundedMinutes.toString().padStart(2, "0")
    return `${hh}:${mm}`
  }
  /**
   * Format date for display in Spanish locale
   */
  static formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return dateObj.toLocaleDateString("es-ES", options || defaultOptions)
  }

  /**
   * Format time for display (24-hour format)
   */
  static formatTime(time: string): string {
    return time
  }

  /**
   * Get current time in HH:MM format
   */
  static getCurrentTime(): string {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  static getCurrentDate(): string {
    return new Date().toISOString().split("T")[0]
  }

  /**
   * Check if a date is today
   */
  static isToday(date: string): boolean {
    return date === this.getCurrentDate()
  }

  /**
   * Check if a date is in the past
   */
  static isPastDate(date: string): boolean {
    return new Date(date) < new Date(this.getCurrentDate())
  }

  /**
   * Check if a date is in the future
   */
  static isFutureDate(date: string): boolean {
    return new Date(date) > new Date(this.getCurrentDate())
  }

  /**
   * Get date range for filtering (last N days)
   */
  static getDateRange(days: number): { start: string; end: string } {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    }
  }

  /**
   * Get week start and end dates
   */
  static getCurrentWeek(): { start: string; end: string } {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    }
  }

  /**
   * Get month start and end dates
   */
  static getCurrentMonth(): { start: string; end: string } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    }
  }

  /**
   * Calculate business days between two dates
   */
  static getBusinessDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let businessDays = 0

    const currentDate = new Date(start)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        businessDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return businessDays
  }

  /**
   * Format duration in hours to human readable format
   */
  static formatDuration(hours: number): string {
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return `${minutes} min`
    }

    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)

    if (minutes === 0) {
      return `${wholeHours}h`
    }

    return `${wholeHours}h ${minutes}min`
  }

  /**
   * Validate time format (HH:MM)
   */
  static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  static isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) return false

    const dateObj = new Date(date)
    return dateObj.toISOString().split("T")[0] === date
  }
}
