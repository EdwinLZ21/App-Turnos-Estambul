import { ShiftManager, type Shift } from "./shift-manager"
import { DateUtils } from "./date-utils"

export interface ReviewMetrics {
  totalReviews: number
  averageReviewTime: number
  reviewsToday: number
  reviewsThisWeek: number
  reviewsThisMonth: number
  pendingCount: number
  reviewerStats: { [reviewer: string]: number }
}

export class ReviewSystem {
  /**
   * Get comprehensive review metrics
   */
  static getReviewMetrics(): ReviewMetrics {
    const allShifts = ShiftManager.getAllShifts()
    const reviewedShifts = allShifts.filter((shift) => shift.status === "reviewed")
    const pendingShifts = allShifts.filter((shift) => shift.status === "pending")

    const today = DateUtils.getCurrentDate()
    const { start: weekStart } = DateUtils.getCurrentWeek()
    const { start: monthStart } = DateUtils.getCurrentMonth()

    const reviewsToday = reviewedShifts.filter(
      (shift) => shift.reviewedAt && shift.reviewedAt.split("T")[0] === today,
    ).length

    const reviewsThisWeek = reviewedShifts.filter(
      (shift) => shift.reviewedAt && shift.reviewedAt.split("T")[0] >= weekStart,
    ).length

    const reviewsThisMonth = reviewedShifts.filter(
      (shift) => shift.reviewedAt && shift.reviewedAt.split("T")[0] >= monthStart,
    ).length

    // Calculate reviewer statistics
    const reviewerStats: { [reviewer: string]: number } = {}
    reviewedShifts.forEach((shift) => {
      if (shift.reviewedBy) {
        reviewerStats[shift.reviewedBy] = (reviewerStats[shift.reviewedBy] || 0) + 1
      }
    })

    return {
      totalReviews: reviewedShifts.length,
      averageReviewTime: 0, // Could be calculated based on submission to review time
      reviewsToday,
      reviewsThisWeek,
      reviewsThisMonth,
      pendingCount: pendingShifts.length,
      reviewerStats,
    }
  }

  /**
   * Get shifts that need urgent review (older than 24 hours)
   */
  static getUrgentReviews(): Shift[] {
    const pendingShifts = ShiftManager.getPendingShifts()
    const urgentThreshold = new Date()
    urgentThreshold.setHours(urgentThreshold.getHours() - 24)

    return pendingShifts.filter((shift) => {
      const shiftDate = new Date(shift.createdAt || shift.date)
      return shiftDate < urgentThreshold
    })
  }

  /**
   * Bulk review multiple shifts
   */
  static bulkReviewShifts(shiftIds: string[], reviewedBy: string, reviewNotes?: string): number {
    let successCount = 0

    shiftIds.forEach((shiftId) => {
      const success = ShiftManager.reviewShift(shiftId, reviewedBy, reviewNotes)
      if (success) successCount++
    })

    return successCount
  }

  /**
   * Get review history for a specific driver
   */
  static getDriverReviewHistory(driverEmail: string, days = 30): Shift[] {
    const driverShifts = ShiftManager.getDriverShifts(driverEmail)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return driverShifts
      .filter((shift) => shift.status === "reviewed" && shift.reviewedAt && new Date(shift.reviewedAt) >= cutoffDate)
      .sort((a, b) => new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime())
  }

  /**
   * Generate review report
   */
  static generateReviewReport(
    startDate: string,
    endDate: string,
  ): {
    summary: ReviewMetrics
    shiftsByDriver: { [driver: string]: Shift[] }
    dailyReviewCounts: { [date: string]: number }
  } {
    const allShifts = ShiftManager.getAllShifts()
    const filteredShifts = allShifts.filter((shift) => {
      if (shift.status !== "reviewed" || !shift.reviewedAt) return false
      const reviewDate = shift.reviewedAt.split("T")[0]
      return reviewDate >= startDate && reviewDate <= endDate
    })

    // Group by driver
    const shiftsByDriver: { [driver: string]: Shift[] } = {}
    filteredShifts.forEach((shift) => {
      if (!shiftsByDriver[shift.driverEmail]) {
        shiftsByDriver[shift.driverEmail] = []
      }
      shiftsByDriver[shift.driverEmail].push(shift)
    })

    // Daily review counts
    const dailyReviewCounts: { [date: string]: number } = {}
    filteredShifts.forEach((shift) => {
      const reviewDate = shift.reviewedAt!.split("T")[0]
      dailyReviewCounts[reviewDate] = (dailyReviewCounts[reviewDate] || 0) + 1
    })

    return {
      summary: this.getReviewMetrics(),
      shiftsByDriver,
      dailyReviewCounts,
    }
  }
}
