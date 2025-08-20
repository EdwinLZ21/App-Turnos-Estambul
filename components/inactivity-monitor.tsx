"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface InactivityMonitorProps {
  onLogout: () => void
  timeoutSeconds?: number
}

export function InactivityMonitor({ onLogout, timeoutSeconds = 30 }: InactivityMonitorProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(timeoutSeconds)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now())
    setShowWarning(false)
    setCountdown(timeoutSeconds)
  }, [timeoutSeconds])

  const handleActivity = useCallback(() => {
    resetActivity()
  }, [resetActivity])

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [handleActivity])

  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity

      if (timeSinceLastActivity >= timeoutSeconds * 1000) {
        if (!showWarning) {
          setShowWarning(true)
          setCountdown(timeoutSeconds)
        } else {
          if (countdown > 0) {
            setCountdown(countdown - 1)
          } else {
            onLogout()
          }
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastActivity, showWarning, countdown, timeoutSeconds, onLogout])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <CardTitle>¿Estás ahí?</CardTitle>
          <CardDescription>Sesión inactiva. Se cerrará automáticamente en {countdown} segundos.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={onLogout} className="flex-1 bg-transparent">
            Salir
          </Button>
          <Button onClick={resetActivity} className="flex-1">
            Sí, estoy aquí
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
