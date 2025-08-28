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
import { NumericInput } from "@/components/ui/NumericInput"



// Persiste turno activo y borrador en LocalStorage
function persistCurrentShift(userId: string, shift: ShiftData | null) {
  if (!userId || !shift) return
  localStorage.setItem(`currentShift_${userId}`, JSON.stringify(shift))
  localStorage.setItem(`currentShiftDraft_${userId}`, JSON.stringify(shift))
  // Notificar a otros componentes (p.ej. el login)
  window.dispatchEvent(new Event("storage"))
}

// Simula actividad para resetear el monitor de inactividad
const simulateActivity = () => {
  const events = ["mousemove", "mousedown", "touchstart", "pointerdown", "keypress"]
  events.forEach((name) => document.dispatchEvent(new Event(name)))
}


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
  const [bonusMessage, setBonusMessage] = useState<string>("")

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
  const homeDeliveryCount = currentShift.homeDeliveryOrders
    .split(",")
    .filter((n: string) => n.trim()).length
  const onlineCount = currentShift.onlineOrders
    .split(",")
    .filter((n: string) => n.trim()).length
  const totalTickets = homeDeliveryCount + onlineCount
  const totalAmount = totalTickets * 0.5
  const hoursEarned = currentShift.hoursWorked * 6
  const molaresBonus = currentShift.molaresOrders ? 1 : 0

  // Mensajes y bonos por metas
  let bonusEuros = 0
  let bonusMsg = ""

  if (totalTickets >= 31) {
    bonusEuros = 2.5
    bonusMsg = "💪 ¡Eres una máquina! Llegaste a 31 pedidos y ganaste 2,50 € extra. ¡Imparable!"
  } else if (totalTickets >= 21) {
    bonusEuros = 1.5
    bonusMsg = "🚀 ¡Súper meta! Completaste 21 pedidos y ganaste 1,50 € extra. ¡A por más!"
  } else if (totalTickets >= 11) {
    bonusEuros = 0.5
    bonusMsg = "🎉 ¡Buen comienzo! Alcanzaste 11 pedidos y ganaste 0,50 € extra. Sigue así."
  } else {
    bonusMsg = "🌟 Sigue esforzándote: alcanza 11 pedidos para ganar un bono."
  }

  const totalEarned = hoursEarned + totalAmount + molaresBonus + bonusEuros
  const totalCajaNeto = currentShift.totalSalesPedidos - currentShift.totalDatafono

  setCurrentShift(prev => ({
    ...prev,
    totalTickets,
    totalAmount,
    totalEarned,
    totalCajaNeto,
  }))

  setBonusMessage(bonusMsg)
}, [
  currentShift.homeDeliveryOrders,
  currentShift.onlineOrders,
  currentShift.hoursWorked,
  currentShift.molaresOrders,
  currentShift.totalSalesPedidos,
  currentShift.totalDatafono,
])

const handleLogout = () => {
  const uid = localStorage.getItem("userId") || ""
  const draftRaw = localStorage.getItem(`currentShiftDraft_${uid}`)
  const draft: ShiftData | null = draftRaw ? JSON.parse(draftRaw) : null
  // Persiste turno activo y borrador
  persistCurrentShift(uid, draft)
  // Limpia sesión
  localStorage.removeItem("userId")
  localStorage.removeItem("userRole")
  router.push("/login")
}


const validateForm = (): string[] => {
  const errors: string[] = []

  // 1) Validar que exista hora de entrada y de salida; 00:00 es válido
  if (!currentShift.entryTime || !currentShift.exitTime) {
    return ["Ingrese la hora de entrada y salida."]
  }

  // 2) Evitar turno de duración cero
  if (currentShift.entryTime === currentShift.exitTime) {
    errors.push("La hora de entrada y de salida no pueden ser iguales.")
  }

  // 3) Sólo validar máximo 7 horas
  if (currentShift.hoursWorked > 7) {
    errors.push("El turno no puede superar las 7 horas.")
  }

  // 4) Validaciones existentes de pedidos y demás
  if (currentShift.molaresOrders && !currentShift.molaresOrderNumbers.trim()) {
    errors.push("Indique los números de pedidos.")
  }

  if (currentShift.homeDeliveryOrders) {
    const homeOrdersStr = currentShift.homeDeliveryOrders
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n)
    const homeOrders = homeOrdersStr.map((n) => Number.parseInt(n, 10))
    if (homeOrdersStr.some((n) => !/^\d+$/.test(n))) {
      errors.push("Los pedidos a domicilio deben ser números enteros positivos.")
    }
    if (homeOrders.some((n) => isNaN(n) || n < 1 || n > 128)) {
      errors.push("Los pedidos a domicilio deben estar entre 1 y 128.")
    }
    if (new Set(homeOrders).size !== homeOrders.length) {
      errors.push("No puede haber pedidos a domicilio duplicados.")
    }
  }

  if (currentShift.onlineOrders) {
    const onlineOrders = currentShift.onlineOrders
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n)
    if (onlineOrders.some((n) => !/^\d{5}$/.test(n))) {
      errors.push("Los pedidos online deben tener 5 dígitos.")
    }
    if (new Set(onlineOrders).size !== onlineOrders.length) {
      errors.push("No puede haber pedidos online duplicados.")
    }
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
        setErrors(["No se pudo guardar el turno. Intente nuevamente."])
      }
    } catch (error) {
    console.error("Error al enviar turno:", error)
    setErrors(["Error de conexión. Verifique su acceso a Internet."])
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
          onPointerDown={() => simulateActivity()}
          onClick={handleBackToPanel}
          className="border-red-200 hover:bg-red-50 bg-transparent text-2xl" 
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Panel
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formulario de Turno</h1>
          <p className="text-gray-600">Complete todos los campos obligatorios</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-t-lg shadow-lg p-6">
            <div className="text-center">
              <CardTitle className="text-3xl font-extrabold mb-1">
                {currentShift.entryTime !== "00:00" && currentShift.exitTime !== "00:00"
                  ? "Continuar Turno"
                  : "Nuevo Turno"}
              </CardTitle>
              <CardDescription className="text-red-100 font-bold text-2xl">
                Fecha: {new Date(currentShift.date).toLocaleDateString("es-ES")}
              </CardDescription>
            </div>

            {true && (
              <div className="mt-6 bg-red-700 text-white rounded-lg p-5 border border-red-600 mx-4">
                <div className="text-center text-2xl font-bold mb-6">RESUMEN</div>
                <div className="mb-6">
                  <div className="text-lg font-semibold mb-2">Horario:</div>
                  <div className="text-xl font-bold ml-4">
                    {currentShift.entryTime} - {currentShift.exitTime}
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-lg font-semibold mb-2">Pedidos a domicilio:</div>
                  <div className="ml-4 flex flex-wrap gap-2">
                    {currentShift.homeDeliveryOrders
                      ? currentShift.homeDeliveryOrders.split(',').map((pedido, i) => (
                          <span key={i} className="text-lg font-bold font-mono bg-red-600/40 px-3 py-2 rounded">
                            {pedido.trim()}
                          </span>
                        ))
                      : <span className="text-lg">Ninguno</span>}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold mb-2">Pedidos online:</div>
                  <div className="ml-4 flex flex-wrap gap-2">
                    {currentShift.onlineOrders
                      ? currentShift.onlineOrders.split(',').map((pedido, i) => (
                          <span key={i} className="text-lg font-bold font-mono bg-red-600/40 px-3 py-2 rounded">
                            {pedido.trim()}
                          </span>
                        ))
                      : <span className="text-lg">Ninguno</span>}
                  </div>
                </div>
              </div>
            )}

          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="space-y-3">
                <Label htmlFor="date" className="text-xl font-semibold">
                  Fecha del Turno
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={currentShift.date}
                  onFocus={() => simulateActivity()}
                  onChange={(e) => {
                    simulateActivity()
                    setCurrentShift(prev => ({ ...prev, date: e.target.value }))
                  }}
                  className="text-2xl bg-white py-4 px-5"
                  style={{ fontSize: '1.3rem' }}
                />
              </div>

              {/* Entry and Exit Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="entryTime" className="text-xl font-semibold">
                    Hora de Entrada
                  </Label>
                  <Select
                    value={currentShift.entryTime}
                    onValueChange={(value) => {
                      simulateActivity()
                      setCurrentShift(prev => ({ ...prev, entryTime: value }))
                    }}
                  >
                    <SelectTrigger className={`bg-white text-2xl py-4 px-5 ${isEntryTimeError ? "border-red-500 focus:border-red-600" : ""}`} style={{ fontSize: '1.3rem' }}>
                      <SelectValue placeholder="00:00" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions().map(time => (
                        <SelectItem key={time} value={time} className="text-xl">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="exitTime" className="text-xl font-semibold">
                    Hora de Salida
                  </Label>
                  <Select
                    value={currentShift.exitTime}
                    onValueChange={(value) => {
                      simulateActivity()
                      setCurrentShift(prev => ({ ...prev, exitTime: value }))
                    }}
                  >
                    <SelectTrigger className={`bg-white text-2xl py-4 px-5 ${isExitTimeError ? "border-red-500 focus:border-red-600" : ""}`} style={{ fontSize: '1.3rem' }}>
                      <SelectValue placeholder="00:00" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeOptions().map(time => (
                        <SelectItem key={time} value={time} className="text-xl">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cash Change */}
              <div className="space-y-3">
                <Label className="text-xl font-semibold">Cambio de Caja</Label>
                <div className="py-4 px-5 bg-gray-100 rounded-lg">
                  <span className="text-2xl font-bold" style={{ fontSize: '1.3rem' }}>
                    {currentShift.cashChange.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Orders: Home Delivery */}
              <div className="space-y-3">
                <Label htmlFor="homeDelivery" className="text-xl font-semibold">
                  Número de Pedidos a Domicilio (1–128)
                  {isHomeInvalid && <span className="text-red-600 text-lg ml-2">valor inválido</span>}
                </Label>
                <Textarea
                  id="homeDelivery"
                  placeholder="p. ej.: 45, 67, 89"
                  value={currentShift.homeDeliveryOrders}
                  inputMode="decimal"
                  onFocus={() => simulateActivity()}
                  onChange={(e) => {
                    simulateActivity()
                    setCurrentShift(prev => ({ ...prev, homeDeliveryOrders: e.target.value }))
                  }}
                  className={`
                    text-2xl bg-white h-32 py-4 px-5 resize-y overflow-auto whitespace-pre-wrap break-words
                    ${isHomeInvalid ? "border-red-500 focus:border-red-600" : ""}
                  `}
                  style={{ fontSize: '1.3rem' }}
                />
              </div>

              {/* Orders: Online */}
              <div className="space-y-3">
                <Label htmlFor="onlineOrders" className="text-xl font-semibold">
                  Número de Pedidos Online (5 dígitos)
                  {isOnlineInvalid && <span className="text-red-600 text-lg ml-2">valor inválido</span>}
                </Label>
                <Textarea
                  id="onlineOrders"
                  placeholder="Ej: 12345, 67890"
                  value={currentShift.onlineOrders}
                  inputMode="decimal"
                  onFocus={() => simulateActivity()}
                  onChange={(e) => {
                    simulateActivity()
                    setCurrentShift(prev => ({ ...prev, onlineOrders: e.target.value }))
                  }}
                  className={`
                    text-2xl bg-white h-32 py-4 px-5 resize-y overflow-auto whitespace-pre-wrap break-words
                    ${isOnlineInvalid ? "border-red-500 focus:border-red-600" : ""}
                  `}
                  style={{ fontSize: '1.3rem' }}
                />
              </div>

              {/* Molares Orders */}
              <div className="space-y-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="molares"
                    checked={currentShift.molaresOrders}
                    onPointerDown={() => simulateActivity()}
                    onCheckedChange={(checked) => {
                      simulateActivity()
                      setCurrentShift(prev => ({ ...prev, molaresOrders: checked as boolean }))
                    }}
                    className="w-6 h-6 border-2 border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="molares" className="text-xl font-semibold text-blue-800 cursor-pointer">
                    Pedido a Molares (+1 €)
                  </Label>
                </div>
                {currentShift.molaresOrders && (
                  <Textarea
                    placeholder="Números de Pedidos a Molares"
                    value={currentShift.molaresOrderNumbers}
                    inputMode="decimal"
                    onFocus={() => simulateActivity()}
                    onChange={(e) => {
                      simulateActivity()
                      setCurrentShift(prev => ({ ...prev, molaresOrderNumbers: e.target.value }))
                    }}
                    className={`
                      text-2xl bg-white h-32 py-4 px-5 resize-y overflow-auto whitespace-pre-wrap break-words
                      ${(isMolaresInvalid || isMolaresNonexistent) ? "border-red-500 focus:border-red-600" : ""}
                    `}
                    style={{ fontSize: '1.3rem' }}
                  />
                )}
                {currentShift.molaresOrders && !currentShift.molaresOrderNumbers.trim() && (
                  <span className="text-red-600 text-lg">Indique los pedidos llevados</span>
                )}
                {currentShift.molaresOrders && currentShift.molaresOrderNumbers.trim() && isMolaresNonexistent && (
                  <span className="text-red-600 text-lg">pedido inexistente</span>
                )}
              </div>

              {/* Incidencias */}
              <div className="space-y-3">
                <Label htmlFor="incidents" className="text-xl font-semibold">
                  Incidencias
                </Label>
                <Textarea
                  id="incidents"
                  placeholder="Describe cualquier incidencia durante el turno..."
                  value={currentShift.incidents}
                  onFocus={() => simulateActivity()}
                  onChange={(e) => {
                    simulateActivity()
                    setCurrentShift(prev => ({ ...prev, incidents: e.target.value }))
                  }}
                  className="text-2xl bg-white h-32 py-4 px-5 resize-y overflow-auto whitespace-pre-wrap break-words"
                  style={{ fontSize: '1.3rem' }}
                />
              </div>

              {/* Calculated Fields */}
              <div className="space-y-6 border-2 border-blue-200 rounded-lg p-8 bg-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="h-7 w-7 text-blue-600" />
                  <h3 className="text-2xl font-bold text-blue-800">Pago al Repartidor</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold">Tiempo Trabajado</Label>
                    <div className="py-4 px-5 bg-white rounded-lg">
                      <span className="text-2xl font-bold" style={{ fontSize: '1.3rem' }}>{currentShift.hoursWorked}h</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold">Total de Tickets</Label>
                    <div className="py-4 px-5 bg-white rounded-lg">
                      <span className="text-2xl font-bold" style={{ fontSize: '1.3rem' }}>{currentShift.totalTickets}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold">Importe de Pedidos</Label>
                    <div className="py-4 px-5 bg-white rounded-lg">
                      <span className="text-2xl font-bold" style={{ fontSize: '1.3rem' }}>{currentShift.totalAmount.toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold">Total Cobrado</Label>
                    <div className="py-4 px-5 bg-blue-100 rounded-lg border border-blue-200">
                      <span className="text-2xl font-bold text-blue-700" style={{ fontSize: '1.3rem' }}>{currentShift.totalEarned.toFixed(2)} €</span>
                    </div>
                  </div>
                  {bonusMessage && (
                    <div className="space-y-3 col-span-2">
                      <Label className="text-xl font-semibold">Bono por Pedidos</Label>
                      <div className="py-4 px-5 bg-blue-100 rounded-lg border border-blue-200">
                        <span className="text-lg font-semibold text-blue-700">{bonusMessage}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Ingresos de Caja */}
              <div className="space-y-6 border-2 border-green-200 rounded-lg p-6 bg-green-50">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h3 className="text-2xl font-bold text-green-800">Ingresos de Caja</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="totalSales" className="text-xl font-semibold text-green-800">
                      Total Venta Pedidos (€)
                    </Label>
<NumericInput
  id="totalSales"
  value={currentShift.totalSalesPedidos}
  onFocus={() => simulateActivity()}
  onBlur={() => simulateActivity()}
  onChange={(e) => {
    simulateActivity()
    // Convierte coma a punto para parsear correctamente
    const normalized = e.target.value.replace(/,/g, ".")
    setCurrentShift(prev => ({
      ...prev,
      totalSalesPedidos: parseFloat(normalized) || 0
    }))
  }}
  className="text-2xl bg-white h-12 py-4 px-5 border-green-300 focus:border-green-500"
  style={{ fontSize: '1.3rem' }}
/>

                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="totalDatafono" className="text-xl font-semibold text-green-800">
                      Total de Pedidos Cobrados con Datáfono (€)
                    </Label>
<NumericInput
  id="totalDatafono"
  value={currentShift.totalDatafono}
  onFocus={() => simulateActivity()}
  onBlur={() => simulateActivity()}
  onChange={(e) => {
    simulateActivity()
    const normalized = e.target.value.replace(/,/g, ".")
    setCurrentShift(prev => ({
      ...prev,
      totalDatafono: parseFloat(normalized) || 0
    }))
  }}
  className="text-2xl bg-white h-12 py-4 px-5 border-green-300 focus:border-green-500"
  style={{ fontSize: '1.3rem' }}
/>

                  </div>
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold text-green-800">Total Caja Neto</Label>
                    <div className="py-4 px-5 bg-green-200 border-2 border-green-400 rounded-lg">
                      <span
                        className={`text-2xl font-bold ${currentShift.totalCajaNeto < 0 ? "text-red-700" : "text-green-800"}`}
                        style={{ fontSize: '1.3rem' }}
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

              <Button
                type="submit"
                onPointerDown={() => simulateActivity()}
                className="w-full bg-red-600 hover:bg-red-700 text-xl font-semibold py-4"
                size="lg"
              >
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