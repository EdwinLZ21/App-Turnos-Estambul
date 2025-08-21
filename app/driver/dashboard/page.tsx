
"use client"
import { AuthGuard } from "@/components/auth-guard"
import { InactivityMonitor } from "@/components/inactivity-monitor"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, CheckCircle, LogOut, User, Plus, Edit } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  status: string // Added status field
}

export default function DriverDashboard() {
  /**
   * Panel de conductor: gestión de turnos y estado personal.
   * Documentación de funciones principales para facilitar refactorización.
   */
    const router = useRouter() // --- Panel CONDUCTOR ---
  const [userId, setUserId] = useState("")
  const [previousShift, setPreviousShift] = useState<ShiftData | null>(null)
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null)
  const [currentShiftDraft, setCurrentShiftDraft] = useState<ShiftData | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem("userId") || ""
    
    // Si cambió de usuario, limpiar datos del usuario anterior
    if (userId && userId !== id) {
      clearUserData(userId)
    }
    
    setUserId(id)

    // Cargar turno anterior desde previousShift_{id} si existe
    const previousShiftRaw = localStorage.getItem(`previousShift_${id}`)
    if (previousShiftRaw) {
      setPreviousShift(JSON.parse(previousShiftRaw))
    } else {
      // Si no hay turno anterior, buscar en driverShifts
      const driverShifts = JSON.parse(localStorage.getItem("driverShifts") || "{}")
      const userShifts = driverShifts[id] || []
      if (userShifts.length > 0) {
        const lastReviewedShift = userShifts[userShifts.length - 1]
        setPreviousShift(lastReviewedShift)
      } else {
        setPreviousShift(null)
      }
    }

    // Cargar borrador específico del usuario actual
    const savedCurrentShiftDraft = localStorage.getItem(`currentShiftDraft_${id}`)
    if (savedCurrentShiftDraft) {
      setCurrentShiftDraft(JSON.parse(savedCurrentShiftDraft))
    } else {
      setCurrentShiftDraft(null)
    }

    // Cargar estado de envío específico del usuario actual
    const shiftSubmitted = localStorage.getItem(`shiftSubmitted_${id}`) === "true"
    setIsSubmitted(shiftSubmitted)

    // Cargar turno actual específico del usuario actual
    const savedCurrentShift = localStorage.getItem(`currentShift_${id}`)
    if (savedCurrentShift && shiftSubmitted) {
      setCurrentShift(JSON.parse(savedCurrentShift))
    } else {
      setCurrentShift(null)
    }
  }, [userId]) // Agregar userId como dependencia para detectar cambios de usuario

  /**
   * Cierra sesión y limpia datos de usuario.
   */
  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    router.push("/login")
  }

  /**
   * Limpia los turnos y estado local del repartidor actual.
   */
  const handleClearTurno = () => {
    try {
      // Limpiar turnos del repartidor actual
      const driverShifts = JSON.parse(localStorage.getItem("driverShifts") || "{}")
      delete driverShifts[userId]
      localStorage.setItem("driverShifts", JSON.stringify(driverShifts))
      
      // Limpiar localStorage específico del usuario actual
      localStorage.removeItem(`currentShift_${userId}`)
      localStorage.removeItem(`currentShiftDraft_${userId}`)
      localStorage.removeItem(`shiftSubmitted_${userId}`)
      
      // Limpiar estado local
      setPreviousShift(null)
      setCurrentShift(null)
      setCurrentShiftDraft(null)
      setIsSubmitted(false)
    } catch {}
  }

  /**
   * Limpia los datos de localStorage para el usuario especificado.
   */
  const clearUserData = (userId: string) => {
    try {
      // Limpiar localStorage específico del usuario
      localStorage.removeItem(`currentShift_${userId}`)
      localStorage.removeItem(`currentShiftDraft_${userId}`)
      localStorage.removeItem(`shiftSubmitted_${userId}`)
      localStorage.removeItem(`previousShift_${userId}`)
    } catch {}
  }

  const handleNewShift = () => {
    router.push("/driver/shift-form")
  }

  const handleContinueShift = () => {
    router.push("/driver/shift-form")
  }

  return (
    <AuthGuard requiredRole="driver">
      <InactivityMonitor onLogout={handleLogout} />

      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full shadow-lg border border-red-200 bg-transparent overflow-hidden flex items-center justify-center">
              <Image
                src="/Logo-Estambul.jpg"
                alt="Logo Estambul"
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-full border border-red-200"
                style={{background: 'transparent', objectFit: 'cover', borderRadius: '50%'}}
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">Panel de Repartidor</h1>
              <p className="text-lg text-red-600 font-medium">Repartidor {userId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 border-red-200 hover:bg-red-50 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="h-6 w-6" />
                Turno Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {isSubmitted && currentShift ? (
                <div className="text-center space-y-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-green-700">Turno Enviado</h3>
                    <p className="text-gray-600">Fecha: {currentShift.date}</p>
                    <p className="text-gray-600">
                      Horario: {currentShift.entryTime} - {currentShift.exitTime}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
                    Pendiente de Revisión
                  </Badge>
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{currentShift.hoursWorked}h</p>
                      <p className="text-sm text-gray-500">Horas trabajadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{currentShift.totalTickets}</p>
                      <p className="text-sm text-gray-500">Total tickets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{currentShift.totalEarned.toFixed(2)} €</p>
                      <p className="text-sm text-gray-500">Total cobrado</p>
                    </div>
                  </div>
                  <div className="mt-8 text-center p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-4xl font-bold text-green-600 mb-2">{currentShift.totalCajaNeto.toFixed(2)} €</p>
                    <p className="text-lg font-medium text-green-700">Total Caja Neto</p>
                  </div>
                </div>
              ) : currentShiftDraft &&
                (currentShiftDraft.entryTime ||
                  currentShiftDraft.exitTime ||
                  currentShiftDraft.homeDeliveryOrders ||
                  currentShiftDraft.onlineOrders) ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-blue-700">Turno en Progreso</h3>
                      <p className="text-gray-600">Fecha: {currentShiftDraft.date}</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 text-sm">
                      Pendiente
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Horario</p>
                      <p className="font-semibold text-gray-900">
                        {currentShiftDraft.entryTime || "--:--"} - {currentShiftDraft.exitTime || "--:--"}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Horas</p>
                      <p className="text-xl font-bold text-blue-600">{currentShiftDraft.hoursWorked || 0}h</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Tickets</p>
                      <p className="text-xl font-bold text-blue-600">{currentShiftDraft.totalTickets || 0}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Total</p>
                      <p className="text-xl font-bold text-blue-600">
                        {(currentShiftDraft.totalEarned || 0).toFixed(2)} €
                      </p>
                    </div>
                  </div>

                  {currentShiftDraft.totalCajaNeto > 0 && (
                    <div className="text-center p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                      <p className="text-3xl font-bold text-green-600 mb-2">
                        {currentShiftDraft.totalCajaNeto.toFixed(2)} €
                      </p>
                      <p className="text-lg font-medium text-green-700">Total Caja Neto</p>
                    </div>
                  )}

                  <div className="text-center">
                    <Button onClick={handleContinueShift} size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                      <Edit className="h-5 w-5 mr-2" />
                      Continuar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <Clock className="h-16 w-16 text-red-500 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">Sin Turno Activo</h3>
                    <p className="text-gray-600">Inicia un nuevo turno para comenzar</p>
                  </div>
                  <Button onClick={handleNewShift} size="lg" className="bg-red-600 hover:bg-red-700 px-8 py-3">
                    <Plus className="h-5 w-5 mr-2" />
                    Iniciar Nuevo Turno
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-6 w-6" />
                Turno Anterior
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {previousShift ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-900">{previousShift.date}</h4>
                    {previousShift.status === "unreviewed" ? (
                      <span className="px-4 py-1 rounded-full bg-yellow-100 border border-yellow-400 text-yellow-800 font-semibold shadow-sm animate-pulse">
                        Sin Revisar
                      </span>
                    ) : (
                      <span className="px-4 py-1 rounded-full bg-green-100 border border-green-400 text-green-800 font-semibold shadow-sm">
                        Completado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Horario</p>
                      <p className="font-semibold text-gray-900">
                        {previousShift.entryTime} - {previousShift.exitTime}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Horas</p>
                      <p className="text-xl font-bold text-red-600">{previousShift.hoursWorked}h</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Tickets</p>
                      <p className="text-xl font-bold text-red-600">{previousShift.totalTickets}</p>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-3xl font-bold text-green-600 mb-2">{previousShift.totalEarned.toFixed(2)} €</p>
                    <p className="text-lg font-medium text-green-700">Pago del turno</p>
                  </div>

                  {previousShift.incidents && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Incidencias:</p>
                      <p className="text-sm text-yellow-700">{previousShift.incidents}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto" />
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-gray-500">Sin turnos anteriores</h4>
                    <p className="text-sm text-gray-400">Los turnos completados aparecerán aquí</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
