"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, AlertCircle, CheckCircle, DollarSign } from "lucide-react"
import { ShiftManager } from "@/lib/shift-manager"
import { InactivityMonitor } from "@/components/inactivity-monitor"
import Image from "next/image"

interface ShiftData {
  date: string
  entryTime: string
  exitTime: string
  cashChange: number
  homeDeliveryOrders: string
  onlineOrders: string
  incidents: string
  hoursWorked: number
  totalTickets: number
  totalAmount: number
  totalEarned: number
  molaresOrders: boolean
  molaresOrderNumbers: string
  totalSalesPedidos: number
  totalDatafono: number
  totalCajaNeto: number
}

export default function ShiftForm() {
  const router = useRouter()
  const [currentShift, setCurrentShift] = useState<ShiftData>(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") || "" : ""
    const savedShift = typeof window !== 'undefined' ? localStorage.getItem(`currentShiftDraft_${userId}`) : null
    if (savedShift) {
      try {
        return JSON.parse(savedShift)
      } catch {}
    }
    return {
      date: new Date().toISOString().split("T")[0],
      entryTime: "00:00",
      exitTime: "00:00",
      cashChange: 50.1,
      homeDeliveryOrders: "",
      onlineOrders: "",
      incidents: "",
      hoursWorked: 0,
      totalTickets: 0,
      totalAmount: 0,
      totalEarned: 0,
      molaresOrders: false,
      molaresOrderNumbers: "",
      totalSalesPedidos: 0,
      totalDatafono: 0,
      totalCajaNeto: 0,
    }
  })
  const [errors, setErrors] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem("userId") || ""
    const savedShift = localStorage.getItem(`currentShiftDraft_${userId}`)
    if (savedShift) {
      try {
        const parsedShift = JSON.parse(savedShift)
        setCurrentShift(parsedShift)
      } catch (error) {
        console.error("Error loading saved shift:", error)
      }
    }
  }, [])

  // Ensure default initialization to 00:00 when missing
  useEffect(() => {
    setCurrentShift((prev) => ({
      ...prev,
      entryTime: prev.entryTime || "00:00",
      exitTime: prev.exitTime || "00:00",
    }))
    // Run once after mount and potential draft load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem("userId") || ""
    localStorage.setItem(`currentShiftDraft_${userId}`, JSON.stringify(currentShift))
  }, [currentShift])

  useEffect(() => {
    if (currentShift.entryTime && currentShift.exitTime) {
      const [entryHour, entryMin] = currentShift.entryTime.split(":").map(Number)
      const [exitHour, exitMin] = currentShift.exitTime.split(":").map(Number)

      const entryMinutes = entryHour * 60 + entryMin
      let exitMinutes = exitHour * 60 + exitMin

      if (exitMinutes < entryMinutes) {
        exitMinutes += 24 * 60
      }

      const diffMinutes = exitMinutes - entryMinutes
      const diffHours = diffMinutes / 60
      const roundedHours = Math.round(diffHours * 2) / 2

      setCurrentShift((prev) => ({ ...prev, hoursWorked: roundedHours }))
    }
  }, [currentShift.entryTime, currentShift.exitTime])

  useEffect(() => {
    const homeDeliveryCount = currentShift.homeDeliveryOrders.split(",").filter((n) => n.trim()).length
    const onlineCount = currentShift.onlineOrders.split(",").filter((n) => n.trim()).length
    const totalTickets = homeDeliveryCount + onlineCount
    const totalAmount = totalTickets * 0.5
    const hoursEarned = currentShift.hoursWorked * 6
    const molaresBonus = currentShift.molaresOrders ? 1 : 0
    const totalEarned = hoursEarned + totalAmount + molaresBonus
    const totalCajaNeto = currentShift.totalSalesPedidos - currentShift.totalDatafono

    setCurrentShift((prev) => ({
      ...prev,
      totalTickets,
      totalAmount,
      totalEarned,
      totalCajaNeto,
    }))
  }, [
    currentShift.homeDeliveryOrders,
    currentShift.onlineOrders,
    currentShift.hoursWorked,
    currentShift.molaresOrders,
    currentShift.totalSalesPedidos,
    currentShift.totalDatafono,
  ])

  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    router.push("/login")
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    // Permitir 00:00 como hora válida de salida (medianoche del día siguiente)
    const missingTimes =
      !currentShift.entryTime ||
      !currentShift.exitTime

    // Solo considerar inválido si ambas horas están en 00:00 (sin seleccionar)
    const bothDefaultTimes = 
      currentShift.entryTime === "00:00" && 
      currentShift.exitTime === "00:00"

    if (missingTimes || bothDefaultTimes) {
      return ["ingrese los datos correctamente"]
    }

    if (!currentShift.entryTime) errors.push("Ingresa la hora de entrada")
    if (!currentShift.exitTime) errors.push("Ingresa la hora de salida")
    if (currentShift.entryTime && currentShift.exitTime && currentShift.entryTime === currentShift.exitTime) {
      errors.push("La hora de entrada y salida no deben ser las mismas")
    }
    if (currentShift.hoursWorked < 2) errors.push("El turno debe ser de mínimo 2 horas")
    if (currentShift.hoursWorked > 7) errors.push("Horas inválidas: no puede exceder 7 horas")
    if (currentShift.molaresOrders && !currentShift.molaresOrderNumbers.trim()) {
      errors.push("Indique los pedidos llevados")
    }

    if (currentShift.homeDeliveryOrders) {
      const homeOrdersStr = currentShift.homeDeliveryOrders
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n)
      const homeOrders = homeOrdersStr.map((n) => Number.parseInt(n))

      const hasInvalidFormat = homeOrdersStr.some((n) => !/^\d+$/.test(n))
      const invalidHome = homeOrders.some((n) => isNaN(n) || n < 1 || n > 128)
      const duplicateHome = new Set(homeOrders).size !== homeOrders.length

      if (hasInvalidFormat) errors.push("Los pedidos a domicilio solo pueden contener números enteros positivos")
      if (invalidHome) errors.push("Los pedidos a domicilio deben estar entre 1 y 128")
      if (duplicateHome) errors.push("No puede haber pedidos a domicilio duplicados")
    }

    if (currentShift.onlineOrders) {
      const onlineOrders = currentShift.onlineOrders
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n)
      const invalidOnline = onlineOrders.some((n) => !/^\d{5}$/.test(n))
      const duplicateOnline = new Set(onlineOrders).size !== onlineOrders.length

      if (invalidOnline) errors.push("Los pedidos online deben ser números de 5 dígitos")
      if (duplicateOnline) errors.push("No puede haber pedidos online duplicados")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const validationErrors = validateForm()

    if (hasInlineInvalid || validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])

    try {
      const driverId = localStorage.getItem("userId") || ""
      const driverEmail = `driver${driverId}@estambul.com`

      console.log('📤 Enviando turno a Supabase...')
      console.log('Datos del turno:', currentShift)

      // CREAR Y GUARDAR EN SUPABASE
      const shift = ShiftManager.createShift(
        driverEmail,
        currentShift.entryTime,
        currentShift.exitTime,
        currentShift.totalTickets,
        currentShift.totalEarned,
        currentShift.incidents
      )

      const success = await ShiftManager.saveShift(shift)

      if (success) {
        console.log('✅ Turno guardado exitosamente!')

        // 1. Prepara el objeto pendingShift
        const pendingShift = {
          ...currentShift,
          id: shift.id,
          driverId: driverId,
          status: "pending" as const,
          submittedAt: new Date().toISOString(),
        }

        // 2. Guarda en localStorage para que el cajero lo vea
        localStorage.setItem(`currentShift_${driverId}`, JSON.stringify(pendingShift))
        localStorage.setItem(`shiftSubmitted_${driverId}`, "true")
        // 3. **Elimina** el borrador y el turno activo para que no vuelva a listarse
        localStorage.removeItem(`currentShiftDraft_${driverId}`)
        localStorage.removeItem(`currentShift_${driverId}`) 

        // 4. Notifica a otros listeners (modal de login, dashboard) que cambió el storage
        window.dispatchEvent(new Event('storage'))
        // 5. Redirige al repartidor
        router.push("/driver/dashboard")
      } else {
        console.log('❌ Error al guardar en Supabase')
        setErrors(["Error al guardar en la base de datos. Intenta nuevamente."])
      }
    } catch (error) {
    console.error("Error al enviar turno:", error)
    setErrors(["Error de conexión. Verifica tu conexión a internet."])
    }
  }


  const handleBackToPanel = () => {
    const userId = localStorage.getItem("userId") || ""
    // Guardar como borrador para mantener el estado
    localStorage.setItem(`currentShiftDraft_${userId}`, JSON.stringify(currentShift))
    // También guardar como turno actual para mantener el estado
    localStorage.setItem(`currentShift_${userId}`, JSON.stringify(currentShift))
    router.push("/driver/dashboard")
  }

  // Guardar automáticamente el borrador cada vez que cambie
  useEffect(() => {
    const userId = localStorage.getItem("userId") || ""
    if (userId && currentShift) {
      localStorage.setItem(`currentShiftDraft_${userId}`, JSON.stringify(currentShift))
    }
  }, [currentShift])

  const generateTimeOptions = () => {
    const options = []

    for (let hour = 12; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        options.push(timeString)
      }
    }

    for (let hour = 0; hour <= 2; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        options.push(timeString)
      }
    }

    return options
  }

  // Derived inline validation flags for orders
  const homeTokens = currentShift.homeDeliveryOrders
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n)
  const isHomeInvalid =
    homeTokens.length > 0 &&
    (homeTokens.some((n) => !/^\d+$/.test(n)) ||
      homeTokens
        .map((n) => Number.parseInt(n))
        .some((n) => isNaN(n) || n < 1 || n > 128))

  const onlineTokens = currentShift.onlineOrders
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n)
  const isOnlineInvalid = onlineTokens.length > 0 && onlineTokens.some((n) => !/^\d{5}$/.test(n))

  // Molares: deben ser pedidos existentes entre domicilio u online
  const molaresTokens = currentShift.molaresOrderNumbers
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n)
  const allowedOrderTokens = new Set<string>([...homeTokens, ...onlineTokens])
  const isMolaresInvalid = currentShift.molaresOrders && !currentShift.molaresOrderNumbers.trim()
  const isMolaresNonexistent =
    currentShift.molaresOrders && molaresTokens.length > 0 && molaresTokens.some((t) => !allowedOrderTokens.has(t))

  const hasInlineInvalid = isHomeInvalid || isOnlineInvalid || isMolaresInvalid || isMolaresNonexistent

  // Error flags para resaltar horas en envío
  const isEntryTimeDefaultOrMissing = !currentShift.entryTime || currentShift.entryTime === "00:00"
  const isExitTimeDefaultOrMissing = !currentShift.exitTime
  const bothDefaultTimes = currentShift.entryTime === "00:00" && currentShift.exitTime === "00:00"
  const areTimesEqual = currentShift.entryTime && currentShift.exitTime && currentShift.entryTime === currentShift.exitTime
  const isTooShort = currentShift.entryTime && currentShift.exitTime && currentShift.hoursWorked < 2
  const isTooLong = currentShift.entryTime && currentShift.exitTime && currentShift.hoursWorked > 7
  const isEntryTimeError = submitted && (isEntryTimeDefaultOrMissing || areTimesEqual || isTooShort || isTooLong || bothDefaultTimes)
  const isExitTimeError = submitted && (isExitTimeDefaultOrMissing || areTimesEqual || isTooShort || isTooLong || bothDefaultTimes)

  return (
    <AuthGuard requiredRole="driver">
      <InactivityMonitor onLogout={handleLogout} />

      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={handleBackToPanel}
            className="border-red-200 hover:bg-red-50 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Formulario de Turno</h1>
            <p className="text-gray-600">Completa todos los campos requeridos</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-t-lg shadow-lg p-6">
              <div className="text-center">
                <CardTitle className="text-3xl font-extrabold mb-1">
                  {currentShift && currentShift.entryTime !== "00:00" && currentShift.exitTime !== "00:00"
                  ? "Continuar Turno"
                  : "Nuevo Turno"}
                </CardTitle>
                <CardDescription className="text-red-100 font-medium text-lg">
                  Fecha: {currentShift.date
                  ? new Date(currentShift.date).toLocaleDateString("es-ES")
                  : new Date().toLocaleDateString("es-ES")}
                </CardDescription>
              </div>

              {currentShift && currentShift.entryTime !== "00:00" && currentShift.exitTime !== "00:00" && (
              <div className="mt-6 bg-red-700 text-white rounded-lg p-5 border border-red-600 mx-4">
                <div className="text-center text-xl font-bold mb-4">RESUMEN</div>

                <div className="mb-4">
                  <div className="text-base font-semibold mb-1">Horario:</div>
                  <div className="text-sm ml-4">{currentShift.entryTime} - {currentShift.exitTime}</div>
                </div>

                <div className="mb-4">
                  <div className="text-base font-semibold mb-1">Pedidos a domicilio:</div>
                  <div className="ml-4 flex flex-wrap gap-1">
                    {currentShift.homeDeliveryOrders? currentShift.homeDeliveryOrders.split(',').map((pedido, i) => (
                      <span key={i} className="text-xs font-mono bg-red-600/40 px-2 py-1 rounded">
                        {pedido.trim()}
                      </span>
                    ))
                   : <span className="text-sm">Ninguno</span>}
                  </div>
                </div>

                <div>
                  <div className="text-base font-semibold mb-1">Pedidos online:</div>
                  <div className="ml-4 flex flex-wrap gap-1">
                    {currentShift.onlineOrders? currentShift.onlineOrders.split(',').map((pedido, i) => (
                      <span key={i} className="text-xs font-mono bg-red-600/40 px-2 py-1 rounded">
                        {pedido.trim()}
                      </span>
                    ))
                    : <span className="text-sm">Ninguno</span>}
                  </div>
                </div>
              </div>
              )}
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-medium">
                    Fecha del turno
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={currentShift.date}
                    onChange={(e) =>
                      setCurrentShift((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="text-base bg-white"
                  />
                </div>

                {/* Entry and Exit Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryTime" className="text-base font-medium">
                      Hora de entrada
                    </Label>
                    <Select value={currentShift.entryTime}onValueChange={(value) => setCurrentShift((prev) => ({ ...prev, entryTime: value }))}>
                      <SelectTrigger className={`bg-white text-base ${isEntryTimeError ? "border-red-500 focus:border-red-600" : ""}`}>
                        <SelectValue placeholder="00:00" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitTime" className="text-base font-medium">
                      Hora de salida
                    </Label>
                    <Select value={currentShift.exitTime} onValueChange={(value) => setCurrentShift((prev) => ({ ...prev, exitTime: value }))}>
                      <SelectTrigger className={`bg-white text-base ${isExitTimeError ? "border-red-500 focus:border-red-600" : ""}`}>
                        <SelectValue placeholder="00:00" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cash Change */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Cambio de caja</Label>
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <span className="text-lg font-semibold">
                      {currentShift.cashChange.toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Orders: Home Delivery */}
                <div className="space-y-2">
                  <Label htmlFor="homeDelivery" className="text-base font-medium">
                    Nº pedidos a domicilio (1-128)
                    {isHomeInvalid && (
                      <span className="text-red-600 text-sm ml-2">valor inválido</span>
                    )}
                  </Label>
                  <Textarea
                    id="homeDelivery"
                    placeholder="Ej: 45, 67, 89"
                    value={currentShift.homeDeliveryOrders}
                    onChange={(e) =>
                      setCurrentShift((prev) => ({
                        ...prev,
                        homeDeliveryOrders: e.target.value,
                      }))
                    }
                    className={`
                      text-base bg-white
                      h-24 resize-y overflow-auto
                      whitespace-pre-wrap break-words
                      ${isHomeInvalid ? "border-red-500 focus:border-red-600" : ""}
                    `}
                  />
                </div>

                {/* Orders: Online */}
                <div className="space-y-2">
                  <Label htmlFor="onlineOrders" className="text-base font-medium">
                    Nº pedidos online (5 dígitos)
                    {isOnlineInvalid && (
                      <span className="text-red-600 text-sm ml-2">valor inválido</span>
                    )}
                  </Label>
                  <Textarea
                    id="onlineOrders"
                    placeholder="Ej: 12345, 67890"
                    value={currentShift.onlineOrders}
                    onChange={(e) =>
                      setCurrentShift((prev) => ({
                        ...prev,
                        onlineOrders: e.target.value,
                      }))
                    }
                    className={`
                      text-base bg-white
                      h-24 resize-y overflow-auto
                      whitespace-pre-wrap break-words
                      ${isOnlineInvalid ? "border-red-500 focus:border-red-600" : ""}
                    `}
                  />
                </div>

                {/* Molares Orders */}
                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="molares"
                      checked={currentShift.molaresOrders}
                      onCheckedChange={(checked) =>
                        setCurrentShift((prev) => ({
                          ...prev,
                          molaresOrders: checked as boolean,
                        }))
                      }
                      className="w-5 h-5 border-2 border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label
                      htmlFor="molares"
                      className="text-base font-medium text-blue-800 cursor-pointer"
                    >
                      Viaje a Molares (+1€)
                    </Label>
                  </div>
                  {currentShift.molaresOrders && (
                    <div className="space-y-1">
                      <Textarea
                        placeholder="Números de pedidos a Molares"
                        value={currentShift.molaresOrderNumbers}
                        onChange={(e) =>
                          setCurrentShift((prev) => ({
                            ...prev,
                            molaresOrderNumbers: e.target.value,
                          }))
                        }
                        className={`
                          text-base bg-white
                          h-24 resize-y overflow-auto
                          whitespace-pre-wrap break-words
                          ${(!currentShift.molaresOrderNumbers.trim() ||
                            (currentShift.molaresOrderNumbers.trim() &&
                              molaresTokens.some((t) => !allowedOrderTokens.has(t))))
                            ? "border-red-500 focus:border-red-600"
                            : ""
                          }
                        `}
                      />
                      {!currentShift.molaresOrderNumbers.trim() && (
                        <span className="text-red-600 text-sm">
                          Indique los pedidos llevados
                        </span>
                      )}
                      {currentShift.molaresOrderNumbers.trim() &&
                        molaresTokens.some((t) => !allowedOrderTokens.has(t)) && (
                          <span className="text-red-600 text-sm">pedido inexistente</span>
                        )}
                    </div>
                  )}
                </div>

                  {/* Incidents */}
                {/* Calculated Fields */}
                <div className="space-y-4 border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">Pago a Repartidor</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Tiempo trabajado</Label>
                      <div className="p-4 bg-white rounded-lg">
                        <span className="text-lg font-semibold">{currentShift.hoursWorked}h</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Total tickets</Label>
                      <div className="p-4 bg-white rounded-lg">
                        <span className="text-lg font-semibold">{currentShift.totalTickets}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Importe pedidos</Label>
                      <div className="p-4 bg-white rounded-lg">
                        <span className="text-lg font-semibold">{currentShift.totalAmount.toFixed(2)} €</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium">Total cobrado</Label>
                      <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
                        <span className="text-lg font-bold text-blue-700">{currentShift.totalEarned.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ingresos de Caja */}
                <div className="space-y-6 border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <h3 className="text-xl font-bold text-green-800">Ingresos de Caja</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalSales" className="text-base font-medium text-green-800">
                        Total venta Pedidos (€)
                      </Label>
                      <Input
                        id="totalSales"
                        type="number"
                        step="any"
                        placeholder="200.00"
                        min="0"
                        inputMode="decimal"
                        value={`${currentShift.totalSalesPedidos}`}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          setCurrentShift((prev) => ({
                            ...prev,
                            totalSalesPedidos: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="text-base bg-white border-green-300 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="totalDatafono" className="text-base font-medium text-green-800">
                        Total pedidos cobrados con datafono (€)
                      </Label>
                      <Input
                        id="totalDatafono"
                        type="number"
                        step="any"
                        placeholder="50.00"
                        min="0"
                        inputMode="decimal"
                        value={`${currentShift.totalDatafono}`}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          setCurrentShift((prev) => ({
                            ...prev,
                            totalDatafono: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="text-base bg-white border-green-300 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium text-green-800">Total caja neto</Label>
                      <div className="p-4 bg-green-200 border-2 border-green-400 rounded-lg">
                        <span
                          className={`text-xl font-bold ${currentShift.totalCajaNeto < 0 ? "text-red-700" : "text-green-800"}`}
                        >
                          {(currentShift.totalCajaNeto < 0 ? 0 : currentShift.totalCajaNeto).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" size="lg">
                  Enviar a Revisión
                </Button>
              </form>
            </CardContent>

          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
