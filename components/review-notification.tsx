"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"
import { ShiftManager, type Shift } from "@/lib/shift-manager"

interface ReviewNotificationProps {
  driverEmail: string
}

export function ReviewNotification({ driverEmail }: ReviewNotificationProps) {
  const [recentReviews, setRecentReviews] = useState<Shift[]>([])

  useEffect(() => {
    const checkForRecentReviews = () => {
      const driverShifts = ShiftManager.getDriverShifts(driverEmail)
      const recent = driverShifts
        .filter((shift) => {
          if (shift.status !== "reviewed" || !shift.reviewedAt) return false

          const reviewDate = new Date(shift.reviewedAt)
          const oneDayAgo = new Date()
          oneDayAgo.setDate(oneDayAgo.getDate() - 1)

          return reviewDate > oneDayAgo
        })
        .sort((a, b) => new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime())
        .slice(0, 3)

      setRecentReviews(recent)
    }

    checkForRecentReviews()
    const interval = setInterval(checkForRecentReviews, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [driverEmail])

  if (recentReviews.length === 0) {
    return null
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Turnos Revisados</h3>
        </div>
        <div className="space-y-2">
          {recentReviews.map((shift) => (
            <div key={shift.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Turno del {new Date(shift.date).toLocaleDateString("es-ES")}</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Aprobado
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
