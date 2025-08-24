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
  static async validateShift(
    entryTime: string,
    exitTime: string,
    ticketsDelivered: string,
    netTotal: string,
    driverEmail: string,
    date?: string,
  ): Promise<ShiftValidationError[]> {
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
    if (await this.hasShiftForDate(driverEmail, shiftDate)) {
      errors.push({ field: "date", message: "Ya tienes un turno registrado para esta fecha" })
    }

    return errors
  }

  /**
   * Check if driver already has a shift for the given date
   */
  static async hasShiftForDate(driverEmail: string, date: string): Promise<boolean> {
    const shifts: Shift[] = await this.getDriverShifts(driverEmail)
    return shifts.some((shift: Shift) => shift.date === date)
  }

  /**
   * Get all shifts for a specific driver
   */
  static async getDriverShifts(driverEmail: string): Promise<Shift[]> {
    try {
        const { supabase } = await import('./supabase-client')
        const { data, error } = await supabase
            .from('driver_shifts')  // Usar driver_shifts
            .select('*')
            .eq('driver_email', driverEmail)  // Usar driver_email

        if (error) {
            console.error('Error al obtener turnos:', error)
            return []
        }

        // Mapear de driver_shifts a la interfaz Shift
        return (data || []).map(row => ({
            id: row.id,
            date: row.date,
            entryTime: row.entry_time,
            exitTime: row.exit_time,
            hoursWorked: row.hours_worked,
            ticketsDelivered: row.tickets_delivered,
            netTotal: row.net_total,
            incidents: row.incidents,
            status: row.status,
            driverEmail: row.driver_email,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }))
    } catch (error) {
        console.error('Error de conexión:', error)
        return []
    }
}

/**
 * Save shift for a driver
 */
static async saveShift(shift: Shift): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase-client')
    
    // Obtener datos adicionales del localStorage
    const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") || "" : ""
    const currentShiftData = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(`currentShiftDraft_${userId}`) || '{}')
      : {}

    console.log('📤 Datos a mapear:', currentShiftData)

    // Mapear los datos al esquema de driver_shifts
    const shiftData = {
      driver_id: userId,                        // ← Añadido driver_id
      driver_email: shift.driverEmail,
      date: shift.date,
      entry_time: shift.entryTime,
      exit_time: shift.exitTime,
      hours_worked: shift.hoursWorked,
      tickets_delivered: shift.ticketsDelivered,
      net_total: shift.netTotal,
      incidents: shift.incidents,
      status: shift.status,
      cash_change: currentShiftData.cashChange || 50.1,
      home_delivery_orders: currentShiftData.homeDeliveryOrders
        ? currentShiftData.homeDeliveryOrders
            .split(',')
            .map((n: string) => parseInt(n.trim()))
            .filter((n: number) => !isNaN(n))
        : [],
      online_orders: currentShiftData.onlineOrders
        ? currentShiftData.onlineOrders
            .split(',')
            .map((n: string) => n.trim())
            .filter((n: string) => n)
        : [],
      molares_orders: currentShiftData.molaresOrders || false,
      molares_order_numbers: currentShiftData.molaresOrderNumbers
        ? currentShiftData.molaresOrderNumbers
            .split(',')
            .map((n: string) => n.trim())
            .filter((n: string) => n)
        : [],
      total_tickets: currentShiftData.totalTickets || 0,
      total_amount: currentShiftData.totalAmount || 0,
      total_earned: currentShiftData.totalEarned || 0,
      total_sales_pedidos: currentShiftData.totalSalesPedidos || 0,
      total_datafono: currentShiftData.totalDatafono || 0,
      total_caja_neto: currentShiftData.totalCajaNeto || 0,
    }

    console.log('📤 Datos a enviar a driver_shifts:', shiftData)

    const { data, error } = await supabase
      .from('driver_shifts')
      .insert([shiftData])
      .select()
      .single()

    if (error) {
      console.error('❌ ERROR DETALLADO de Supabase:', error)
      return false
    }

    // 🚀 Guardar el UUID del turno para que el repartidor pueda consultarlo
    if (data?.id) {
      localStorage.setItem(`currentShiftId_${userId}`, data.id)
    }

    console.log('✅ Turno guardado exitosamente en driver_shifts:', data)
    return true

  } catch (error) {
    console.error('💥 ERROR DE CONEXIÓN:', error)
    return false
  }
}

  /**
   * Update an existing shift
   */
  static async updateShift(updatedShift: Shift): Promise<boolean> {
    const { supabase } = await import('./supabase-client')
    const { error } = await supabase
      .from('driver_shifts')
      .update(updatedShift)
      .eq('id', updatedShift.id)
    return !error
  }

  /**
   * Get all shifts from all drivers (for cashier view)
   */
  static async getAllShifts(): Promise<Shift[]> {
    const { supabase } = await import('./supabase-client')
    const { data, error } = await supabase
      .from('driver_shifts')
      .select('*')
    if (error) return []
    return (data || []).sort(
      (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    )
  }

  /**
   * Get pending shifts for review
   */
  static async getPendingShifts(): Promise<Shift[]> {
    const allShifts = await this.getAllShifts()
    return allShifts.filter((shift) => shift.status === "pending")
  }

  /**
   * Get reviewed shifts
   */
  static async getReviewedShifts(): Promise<Shift[]> {
    const allShifts = await this.getAllShifts()
    return allShifts.filter((shift) => shift.status === "reviewed")
  }

  /**
   * Review a shift (mark as reviewed)
   */
  static async reviewShift(shiftId: string, reviewedBy: string, reviewNotes?: string): Promise<boolean> {
    const { supabase } = await import('./supabase-client')
    const { data, error } = await supabase
      .from('driver_shifts')
      .select('*')
      .eq('id', shiftId)
      .single()
    if (error || !data || data.status !== "pending") return false
    const updatedShift = {
      ...data,
      status: "reviewed",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }
    return await this.updateShift(updatedShift)
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
  static async getDriverStats(
    driverEmail: string,
    days = 30,
  ): Promise<{
    totalShifts: number
    totalHours: number
    totalTickets: number
    totalEarnings: number
    averageHoursPerShift: number
    averageTicketsPerShift: number
    averageEarningsPerShift: number
  }> {
    const shifts: Shift[] = await this.getDriverShifts(driverEmail)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentShifts = shifts.filter((shift: Shift) => shift.status === "reviewed" && new Date(shift.date) >= cutoffDate)

    const totalShifts = recentShifts.length
    const totalHours = recentShifts.reduce((sum: number, shift: Shift) => sum + shift.hoursWorked, 0)
    const totalTickets = recentShifts.reduce((sum: number, shift: Shift) => sum + shift.ticketsDelivered, 0)
    const totalEarnings = recentShifts.reduce((sum: number, shift: Shift) => sum + shift.netTotal, 0)

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
  static async clearAllShifts(): Promise<boolean> {
    const { supabase } = await import('./supabase-client')
    const { error } = await supabase.from('driver_shifts').delete().neq('id', '')
    return !error
  }
}
