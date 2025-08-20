"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Clock, Package, DollarSign, AlertTriangle } from "lucide-react"
import { ShiftManager, type Shift, type ShiftValidationError } from "@/lib/shift-manager"
import { DateUtils } from "@/lib/date-utils"

interface ShiftFormProps {
  onSubmit: (shift: Shift) => void
  onCancel: () => void
}

export function ShiftForm({ onSubmit, onCancel }: ShiftFormProps) {
  const [entryTime, setEntryTime] = useState("")
  const [exitTime, setExitTime] = useState("")
  const [hoursWorked, setHoursWorked] = useState(0)
  const [ticketsDelivered, setTicketsDelivered] = useState("")
  const [netTotal, setNetTotal] = useState("")
  const [incidents, setIncidents] = useState("")
  const [errors, setErrors] = useState<ShiftValidationError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    setEntryTime(DateUtils.getCurrentTime())
  }, [])

  useEffect(() => {
    if (entryTime && exitTime) {
      const calculatedHours = ShiftManager.calculateHoursWorked(entryTime, exitTime)
      setHoursWorked(calculatedHours)
    }
  }, [entryTime, exitTime])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const userEmail = localStorage.getItem("userEmail") || ""
    const validationErrors = ShiftManager.validateShift(entryTime, exitTime, ticketsDelivered, netTotal, userEmail)

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    setShowConfirmation(true)
  }

  const confirmSubmit = () => {
    setIsSubmitting(true)
  const [ticketsDelivered, setTicketsDelivered] = useState("")
  const [netTotal, setNetTotal] = useState("")
    const userEmail = localStorage.getItem("userEmail") || ""
    const shift = ShiftManager.createShift(
      userEmail,
      entryTime,
      exitTime,
      Number.parseInt(ticketsDelivered),
      Number.parseFloat(netTotal),
      incidents,
    )

    // Simulate API delay
    setTimeout(() => {
      onSubmit(shift)
      setIsSubmitting(false)
    }, 1000)
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">Confirmar Envío</CardTitle>
              <CardDescription>¿Estás seguro de que quieres enviar este turno a revisión?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Horario:</span>
                  <span className="text-sm font-medium">
                    {entryTime} - {exitTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Horas:</span>
                  <span className="text-sm font-medium">{hoursWorked}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tickets:</span>
                  <span className="text-sm font-medium">{ticketsDelivered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-sm font-medium text-primary">${netTotal}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button onClick={confirmSubmit} className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Confirmar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Registrar Turno</h1>
            <p className="text-sm text-muted-foreground">{DateUtils.formatDate(new Date())}</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Información del Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryTime">Hora de Entrada</Label>
                  <Input
                    id="entryTime"
                    type="time"
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitTime">Hora de Salida</Label>
                  <Input
                    id="exitTime"
                    type="time"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Horas Trabajadas</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{hoursWorked} horas</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tickets">
                  <Package className="h-4 w-4 inline mr-2" />
                  Tickets Entregados
                </Label>
                <Input
                  id="tickets"
                  type="number"
                  min="0"
                  value={ticketsDelivered}
                  onChange={(e) => setTicketsDelivered(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="netTotal">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Total Neto Ingresado
                </Label>
                <Input
                  id="netTotal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={netTotal}
                  onChange={(e) => setNetTotal(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidents">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Incidencias (Opcional)
                </Label>
                <Textarea
                  id="incidents"
                  value={incidents}
                  onChange={(e) => setIncidents(e.target.value)}
                  placeholder="Describe cualquier incidencia durante el turno..."
                  rows={3}
                />
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg">
                Enviar a Revisión
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
