export interface Shift {
  id: string
  date: string
  entryTime: string
  exitTime: string
  hoursWorked: number
  ticketsDelivered: number
  netTotal: number
  incidents?: string
  status: "pending" | "reviewed" | "active"
  driverEmail: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export interface ShiftValidationError {
  field: string
  message: string
}

export class ShiftManager {
  private static readonly MIN_SHIFT_HOURS = 2
  private static readonly MAX_SHIFT_HOURS = 12

  /**
   * Calculate hours worked between two time strings
   */
  static calculateHoursWorked(entryTime: string, exitTime: string): number {
    if (!entryTime || !exitTime) return 0

    const entry = new Date(`2000-01-01T${entryTime}:00`)
    const exit = new Date(`2000-01-01T${exitTime}:00`)

    // Handle overnight shifts
    if (exit < entry) {
      exit.setDate(exit.getDate() + 1)
    }

    const diffMs = exit.getTime() - entry.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.round(diffHours * 100) / 100
  }

  /**
   * Validate shift data before submission
   */
  static validateShift(
    entryTime: string,
    exitTime: string,
    ticketsDelivered: string,
    netTotal: string,
    driverEmail: string,
    date?: string,
  ): ShiftValidationError[] {
    const errors: ShiftValidationError[] = []
    const shiftDate = date || new Date().toISOString().split("T")[0]

    // Validate times
    if (!entryTime) {
      errors.push({ field: "entryTime", message: "La hora de entrada es requerida" })
    }

    if (!exitTime) {
      errors.push({ field: "exitTime", message: "La hora de salida es requerida" })
    }

    // Validate hours worked
    if (entryTime && exitTime) {
      const hoursWorked = this.calculateHoursWorked(entryTime, exitTime)

      if (hoursWorked < this.MIN_SHIFT_HOURS) {
        errors.push({
          field: "hoursWorked",
          message: `El turno debe ser de mínimo ${this.MIN_SHIFT_HOURS} horas`,
        })
      }

      if (hoursWorked > this.MAX_SHIFT_HOURS) {
        errors.push({
          field: "hoursWorked",
          message: `El turno no puede exceder ${this.MAX_SHIFT_HOURS} horas`,
        })
      }
    }

    // Validate tickets delivered
    const tickets = Number.parseInt(ticketsDelivered)
    if (!ticketsDelivered || isNaN(tickets) || tickets < 0) {
      errors.push({ field: "ticketsDelivered", message: "El número de tickets debe ser válido y mayor a 0" })
    }

    // Validate net total
    const total = Number.parseFloat(netTotal)
    if (!netTotal || isNaN(total) || total < 0) {
      errors.push({ field: "netTotal", message: "El total neto debe ser un valor válido y mayor a 0" })
    }

    // Check for duplicate shifts
    if (this.hasShiftForDate(driverEmail, shiftDate)) {
      errors.push({ field: "date", message: "Ya tienes un turno registrado para esta fecha" })
    }

    return errors
  }

  /**
   * Check if driver already has a shift for the given date
   */
  static hasShiftForDate(driverEmail: string, date: string): boolean {
    const shifts = this.getDriverShifts(driverEmail)
    return shifts.some((shift) => shift.date === date)
  }

  /**
   * Get all shifts for a specific driver
   */
  static getDriverShifts(driverEmail: string): Shift[] {
    const shiftsData = localStorage.getItem(`shifts_${driverEmail}`)
    return shiftsData ? JSON.parse(shiftsData) : []
  }

  /**
   * Save shift for a driver
   */
  static saveShift(shift: Shift): void {
    const existingShifts = this.getDriverShifts(shift.driverEmail)
    const updatedShifts = [...existingShifts, shift]
    localStorage.setItem(`shifts_${shift.driverEmail}`, JSON.stringify(updatedShifts))
  }

  /**
   * Update an existing shift
   */
  static updateShift(updatedShift: Shift): void {
    const shifts = this.getDriverShifts(updatedShift.driverEmail)
    const updatedShifts = shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift))
    localStorage.setItem(`shifts_${updatedShift.driverEmail}`, JSON.stringify(updatedShifts))
  }

  /**
   * Get all shifts from all drivers (for cashier view)
   */
  static getAllShifts(): Shift[] {
    const allShifts: Shift[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("shifts_")) {
        const driverEmail = key.replace("shifts_", "")
        const driverShifts: Shift[] = JSON.parse(localStorage.getItem(key) || "[]")

        // Ensure driver email is set on each shift
        const shiftsWithDriver = driverShifts.map((shift) => ({
          ...shift,
          driverEmail: shift.driverEmail || driverEmail,
        }))

        allShifts.push(...shiftsWithDriver)
      }
    }

    return allShifts.sort(
      (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime(),
    )
  }

  /**
   * Get pending shifts for review
   */
  static getPendingShifts(): Shift[] {
    return this.getAllShifts().filter((shift) => shift.status === "pending")
  }

  /**
   * Get reviewed shifts
   */
  static getReviewedShifts(): Shift[] {
    return this.getAllShifts().filter((shift) => shift.status === "reviewed")
  }

  /**
   * Review a shift (mark as reviewed)
   */
  static reviewShift(shiftId: string, reviewedBy: string, reviewNotes?: string): boolean {
    const allShifts = this.getAllShifts()
    const shiftToReview = allShifts.find((shift) => shift.id === shiftId)

    if (!shiftToReview || shiftToReview.status !== "pending") {
      return false
    }

    const updatedShift: Shift = {
      ...shiftToReview,
      status: "reviewed",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }

    this.updateShift(updatedShift)
    return true
  }

  /**
   * Create a new shift
   */
  static createShift(
    driverEmail: string,
    entryTime: string,
    exitTime: string,
    ticketsDelivered: number,
    netTotal: number,
    incidents?: string,
  ): Shift {
    const now = new Date().toISOString()
    const date = now.split("T")[0]
    const hoursWorked = this.calculateHoursWorked(entryTime, exitTime)

    return {
      id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date,
      entryTime,
      exitTime,
      hoursWorked,
      ticketsDelivered,
      netTotal,
      incidents: incidents?.trim() || undefined,
      status: "pending",
      driverEmail,
      createdAt: now,
      updatedAt: now,
    }
  }

  /**
   * Get shift statistics for a driver
   */
  static getDriverStats(
    driverEmail: string,
    days = 30,
  ): {
    totalShifts: number
    totalHours: number
    totalTickets: number
    totalEarnings: number
    averageHoursPerShift: number
    averageTicketsPerShift: number
    averageEarningsPerShift: number
  } {
    const shifts = this.getDriverShifts(driverEmail)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentShifts = shifts.filter((shift) => shift.status === "reviewed" && new Date(shift.date) >= cutoffDate)

    const totalShifts = recentShifts.length
    const totalHours = recentShifts.reduce((sum, shift) => sum + shift.hoursWorked, 0)
    const totalTickets = recentShifts.reduce((sum, shift) => sum + shift.ticketsDelivered, 0)
    const totalEarnings = recentShifts.reduce((sum, shift) => sum + shift.netTotal, 0)

    return {
      totalShifts,
      totalHours: Math.round(totalHours * 100) / 100,
      totalTickets,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      averageHoursPerShift: totalShifts > 0 ? Math.round((totalHours / totalShifts) * 100) / 100 : 0,
      averageTicketsPerShift: totalShifts > 0 ? Math.round((totalTickets / totalShifts) * 100) / 100 : 0,
      averageEarningsPerShift: totalShifts > 0 ? Math.round((totalEarnings / totalShifts) * 100) / 100 : 0,
    }
  }

  /**
   * Export shifts data as CSV
   */
  static exportShiftsToCSV(shifts: Shift[], filename?: string): void {
    const headers = [
      "ID",
      "Fecha",
      "Repartidor",
      "Entrada",
      "Salida",
      "Horas",
      "Tickets",
      "Total",
      "Estado",
      "Incidencias",
      "Revisado Por",
      "Fecha Revisión",
      "Notas Revisión",
    ]

    const csvContent = [
      headers.join(","),
      ...shifts.map((shift) =>
        [
          shift.id,
          shift.date,
          shift.driverEmail,
          shift.entryTime,
          shift.exitTime,
          shift.hoursWorked,
          shift.ticketsDelivered,
          shift.netTotal,
          shift.status,
          `"${shift.incidents || ""}"`,
          shift.reviewedBy || "",
          shift.reviewedAt ? new Date(shift.reviewedAt).toLocaleDateString("es-ES") : "",
          `"${shift.reviewNotes || ""}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `turnos_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  /**
   * Clear all shift data (for testing/reset purposes)
   */
  static clearAllShifts(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("shifts_")) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }
}
