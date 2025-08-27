//cambio visible
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
  bonusEarned: number
}

export interface ShiftValidationError {
  field: string
  message: string
}

export class ShiftManager {
  private static readonly MIN_SHIFT_HOURS = 2
  private static readonly MAX_SHIFT_HOURS = 12

  static calculateHoursWorked(entryTime: string, exitTime: string): number {
    if (!entryTime || !exitTime) return 0
    const entry = new Date(`2000-01-01T${entryTime}:00`)
    const exit = new Date(`2000-01-01T${exitTime}:00`)
    if (exit < entry) exit.setDate(exit.getDate() + 1)
    const diffMs = exit.getTime() - entry.getTime()
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
  }

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

    if (!entryTime) errors.push({ field: "entryTime", message: "La hora de entrada es requerida" })
    if (!exitTime) errors.push({ field: "exitTime", message: "La hora de salida es requerida" })

    if (entryTime && exitTime) {
      const hoursWorked = this.calculateHoursWorked(entryTime, exitTime)
      if (hoursWorked < this.MIN_SHIFT_HOURS) {
        errors.push({ field: "hoursWorked", message: `El turno debe ser de mínimo ${this.MIN_SHIFT_HOURS} horas` })
      }
      if (hoursWorked > this.MAX_SHIFT_HOURS) {
        errors.push({ field: "hoursWorked", message: `El turno no puede exceder ${this.MAX_SHIFT_HOURS} horas` })
      }
    }

    const tickets = Number.parseInt(ticketsDelivered)
    if (!ticketsDelivered || isNaN(tickets) || tickets < 0) {
      errors.push({ field: "ticketsDelivered", message: "El número de tickets debe ser válido y mayor a 0" })
    }

    const total = Number.parseFloat(netTotal)
    if (!netTotal || isNaN(total) || total < 0) {
      errors.push({ field: "netTotal", message: "El total neto debe ser un valor válido y mayor a 0" })
    }

    if (await this.hasShiftForDate(driverEmail, shiftDate)) {
      errors.push({ field: "date", message: "Ya tienes un turno registrado para esta fecha" })
    }

    return errors
  }

  static async hasShiftForDate(driverEmail: string, date: string): Promise<boolean> {
    const shifts: Shift[] = await this.getDriverShifts(driverEmail)
    return shifts.some((shift) => shift.date === date)
  }

  static async getDriverShifts(driverEmail: string): Promise<Shift[]> {
    try {
      const { supabase } = await import('./supabase-client')
      const { data, error } = await supabase
        .from('driver_shifts')
        .select('*')
        .eq('driver_email', driverEmail)

      if (error) {
        console.error('Error al obtener turnos:', error)
        return []
      }

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
        updatedAt: row.updated_at,
        bonusEarned: row.bonus_earned
      }))
    } catch (error) {
      console.error('Error de conexión:', error)
      return []
    }
  }

  static async saveShift(shift: Shift): Promise<boolean> {
    try {
      const { supabase } = await import('./supabase-client')
      const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") || "" : ""
      const currentShiftData = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem(`currentShiftDraft_${userId}`) || '{}')
        : {}

      const shiftData = {
        driver_id: userId,
        driver_email: shift.driverEmail,
        date: shift.date,
        entry_time: shift.entryTime,
        exit_time: shift.exitTime,
        hours_worked: shift.hoursWorked,
        tickets_delivered: shift.ticketsDelivered,
        net_total: shift.netTotal,
        bonus_earned: shift.bonusEarned,
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

      const { data, error } = await supabase
        .from('driver_shifts')
        .insert([shiftData])
        .select()
        .single()

      if (error) {
        console.error('Error de Supabase al guardar turno:', error)
        return false
      }

      if (data?.id) {
        localStorage.setItem(`currentShiftId_${userId}`, data.id)
      }
      return true
    } catch (error) {
      console.error('Error de conexión:', error)
      return false
    }
  }

  static async updateShift(updatedShift: Shift): Promise<boolean> {
    const { supabase } = await import('./supabase-client')
    const { error } = await supabase
      .from('driver_shifts')
      .update({ ...updatedShift, bonus_earned: updatedShift.bonusEarned })
      .eq('id', updatedShift.id)
    return !error
  }

  static async getAllShifts(): Promise<Shift[]> {
    const { supabase } = await import('./supabase-client')
    const { data, error } = await supabase.from('driver_shifts').select('*')
    if (error) return []
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
      updatedAt: row.updated_at,
      bonusEarned: row.bonus_earned
    }))
  }

  static async getPendingShifts(): Promise<Shift[]> {
    const all = await this.getAllShifts()
    return all.filter(s => s.status === "pending")
  }

  static async getReviewedShifts(): Promise<Shift[]> {
    const all = await this.getAllShifts()
    return all.filter(s => s.status === "reviewed")
  }

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
      bonusEarned: data.bonus_earned
    }
    return this.updateShift(updatedShift)
  }

  static async clearAllShifts(): Promise<boolean> {
    const { supabase } = await import('./supabase-client')
    const { error } = await supabase.from('driver_shifts').delete().neq('id', '')
    return !error
  }

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

    // Cálculo de bono por metas
    let bonusEarned = 0
    if (ticketsDelivered >= 31) {
      bonusEarned = 2.5
    } else if (ticketsDelivered >= 21) {
      bonusEarned = 1.5
    } else if (ticketsDelivered >= 11) {
      bonusEarned = 0.5
    }

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
      bonusEarned
    }
  }
}
