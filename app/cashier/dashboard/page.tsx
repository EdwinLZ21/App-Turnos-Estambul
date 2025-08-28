	"use client"
import { AuthGuard } from "@/components/auth-guard"
import { InactivityMonitor } from "@/components/inactivity-monitor"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, User, Calendar, CheckCircle, Filter, LogOut, ChevronUp, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"


interface ShiftData {
  id: string
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
  driverId: string
  status: "pending" | "reviewed" | "unreviewed"
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}


export default function CashierDashboard() {
    /**
     * Panel de Cajero: gestión de turnos, revisión y exportación.
     * Documentación de funciones principales para facilitar refactorización.
     */
    const router = useRouter()
    const [userId, setUserId] = useState("")
    const [pendingShifts, setPendingShifts] = useState<ShiftData[]>([])
    const [reviewedShifts, setReviewedShifts] = useState<ShiftData[]>([])
    const [filterDate, setFilterDate] = useState("")
    const [filterDriver, setFilterDriver] = useState("")


    useEffect(() => {
        const id = localStorage.getItem("userId") || ""
        setUserId(id)

        loadShifts()  // ahora carga desde Supabase

        const handleStorageChange = () => {
            loadShifts()
        }

        window.addEventListener('storage', handleStorageChange)
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])


    /**
     * Calcula la fecha de inicio de la semana laboral (martes)
     */
    const getWorkWeekStart = () => {
        const now = new Date()
        const currentDay = now.getDay() // 0=Dom, 1=Lun, 2=Mar...
        
        let daysToLastTuesday
        
        if (currentDay === 0) { // Domingo
            daysToLastTuesday = 5 // Martes de esta semana
        } else if (currentDay === 1) { // Lunes  
            daysToLastTuesday = 6 // Martes anterior
        } else { // Martes a Sábado
            daysToLastTuesday = currentDay - 2 // Martes de esta semana
        }
        
        const lastTuesday = new Date(now)
        lastTuesday.setDate(now.getDate() - daysToLastTuesday)
        lastTuesday.setHours(0, 0, 0, 0)
        return lastTuesday
    }


    /**
     * ✅ FUNCIÓN ACTUALIZADA: Carga turnos con filtro semanal para historial
     */
    const loadShifts = async () => {
    try {
        // Turnos pendientes (sin cambios)
        const { data: pending, error: pendingError } = await supabase
        .from('driver_shifts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

        // ✅ NUEVO: Historial solo desde martes de la semana laboral
        const workWeekStart = getWorkWeekStart()

        const { data: reviewed, error: reviewedError } = await supabase
        .from('driver_shifts')
        .select('*')
        .eq('status', 'reviewed')
        .gte('reviewed_at', workWeekStart.toISOString()) // ← FILTRO SEMANAL
        .order('reviewed_at', { ascending: false })

        if (pendingError || reviewedError) {
        console.error('Error al cargar los turnos:', pendingError || reviewedError)
        setPendingShifts([])
        setReviewedShifts([])
        return
        }

        // MAPEAR los datos de Supabase a la interfaz ShiftData
        const mappedPending = (pending || []).map(row => ({
            id: row.id,
            date: row.date,
            entryTime: row.entry_time,
            exitTime: row.exit_time,
            cashChange: row.cash_change ?? 0,
            homeDeliveryOrders: row.home_delivery_orders ? row.home_delivery_orders.join(',') : '',
            onlineOrders: row.online_orders ? row.online_orders.join(',') : '',
            incidents: row.incidents || '',
            hoursWorked: row.hours_worked ?? 0,
            totalTickets: row.total_tickets ?? 0,
            totalAmount: row.total_amount ?? 0,
            totalEarned: row.total_earned ?? 0,
            molaresOrders: row.molares_orders ?? false,
            molaresOrderNumbers: row.molares_order_numbers ? row.molares_order_numbers.join(',') : '',
            totalSalesPedidos: row.total_sales_pedidos ?? 0,
            totalDatafono: row.total_datafono ?? 0,
            totalCajaNeto: row.total_caja_neto ?? 0,
            driverId: row.driver_email?.replace('@estambul.com', '').replace('driver', '') || '',
            status: row.status as "pending" | "reviewed" | "unreviewed",
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at,
            reviewNotes: row.review_notes
        }))

        const mappedReviewed = (reviewed || []).map(row => ({
            // Same mapping as above
            id: row.id,
            date: row.date,
            entryTime: row.entry_time,
            exitTime: row.exit_time,
            cashChange: row.cash_change ?? 0,
            homeDeliveryOrders: row.home_delivery_orders ? row.home_delivery_orders.join(',') : '',
            onlineOrders: row.online_orders ? row.online_orders.join(',') : '',
            incidents: row.incidents || '',
            hoursWorked: row.hours_worked ?? 0,
            totalTickets: row.total_tickets ?? 0,
            totalAmount: row.total_amount ?? 0,
            totalEarned: row.total_earned ?? 0,
            molaresOrders: row.molares_orders ?? false,
            molaresOrderNumbers: row.molares_order_numbers ? row.molares_order_numbers.join(',') : '',
            totalSalesPedidos: row.total_sales_pedidos ?? 0,
            totalDatafono: row.total_datafono ?? 0,
            totalCajaNeto: row.total_caja_neto ?? 0,
            driverId: row.driver_email?.replace('@estambul.com', '').replace('driver', '') || '',
            status: row.status as "pending" | "reviewed" | "unreviewed",
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at,
            reviewNotes: row.review_notes
        }))

        setPendingShifts(mappedPending)
        setReviewedShifts(mappedReviewed)
    } catch (error) {
        console.error('Error al cargar turnos:', error)
        setPendingShifts([])
        setReviewedShifts([])
    }
}


    /**
     * Cierra sesión y limpia datos de usuario.
     */
    const handleLogout = () => {
        localStorage.removeItem("userId")
        localStorage.removeItem("userRole")
        router.push("/login")
    }


    /**
     * Marca un turno como revisado y actualiza el estado del repartidor.
     */
    const handleReviewShift = async (shiftId: string, reviewNotes: string, cashierNumber: string) => {
        try {
            const { error } = await supabase
            .from('driver_shifts')
            .update({
                status: 'reviewed',
                reviewed_by: `Cajero ${cashierNumber}`,
                reviewed_at: new Date().toISOString(),
                review_notes: reviewNotes,
            })
            .eq('id', shiftId)

            if (error) {
            console.error('Error al actualizar el turno:', error)
            return
            }
            
            // Recargar turnos para actualizar UI
            await loadShifts()

        } catch (err) {
            console.error('Error al procesar la revisión:', err)
        }
    }



    const handleClosePendingShifts = () => {
        try {
            // Mover turnos pendientes al historial como no revisados (amarillo)
            const pendingAsUnreviewed = pendingShifts.map(shift => ({
                ...shift,
                status: "unreviewed" as const,
                reviewedBy: "Sin revisar",
                reviewedAt: new Date().toISOString(),
                reviewNotes: "Sin revisar"
            }))

            // Agregar al historial
            const currentReviewed = JSON.parse(localStorage.getItem("reviewedShifts") || "[]")
            const updatedReviewed = [...pendingAsUnreviewed, ...currentReviewed]
            localStorage.setItem("reviewedShifts", JSON.stringify(updatedReviewed))

            // Para cada turno pendiente, limpiar el turno actual y guardar el turno como previousShift del repartidor
            const driverShifts = JSON.parse(localStorage.getItem("driverShifts") || "{}")
            pendingAsUnreviewed.forEach(shift => {
                const driverId = shift.driverId
                // Limpiar turno actual y draft
                localStorage.removeItem(`currentShift_${driverId}`)
                localStorage.removeItem(`currentShiftDraft_${driverId}`)
                localStorage.removeItem(`shiftSubmitted_${driverId}`)
                // Guardar el turno como previousShift
                localStorage.setItem(`previousShift_${driverId}`, JSON.stringify(shift))
            })

            // Limpiar pendientes
            localStorage.removeItem("pendingShifts")

            // Actualizar estado
            setPendingShifts([])
            setReviewedShifts(updatedReviewed)
        } catch {}
    }


    const handleClearAllData = () => {
        try {
            // Limpiar todos los datos de localStorage
            localStorage.removeItem("pendingShifts")
            localStorage.removeItem("reviewedShifts")
            localStorage.removeItem("driverShifts")
            
            // Limpiar datos específicos de cada repartidor
            for (let i = 1; i <= 12; i++) {
                localStorage.removeItem(`currentShift_${i}`)
                localStorage.removeItem(`currentShiftDraft_${i}`)
                localStorage.removeItem(`shiftSubmitted_${i}`)
                localStorage.removeItem(`previousShift_${i}`)
            }
            
            // Limpiar estado local
            setPendingShifts([])
            setReviewedShifts([])
        } catch {}
    }


    // Removed clear data per request


    const getFilteredPendingShifts = () => {
        return pendingShifts.filter((shift) => {
            const matchesDate = !filterDate || shift.date === filterDate
            const matchesDriver = !filterDriver || shift.driverId.includes(filterDriver)
            return matchesDate && matchesDriver
        })
    }


    /**
     * ✅ FUNCIÓN SIMPLIFICADA: Ya no necesita filtro temporal (se hace en BD)
     */
    const getFilteredReviewedShifts = () => {
        return reviewedShifts.filter((shift) => {
            const matchesDate = !filterDate || shift.date === filterDate
            const matchesDriver = !filterDriver || shift.driverId.includes(filterDriver)
            return matchesDate && matchesDriver
        })
    }


    return (
        <AuthGuard requiredRole="cashier">
            <InactivityMonitor onLogout={handleLogout} timeoutSeconds={15} />
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full shadow-lg border border-red-200 overflow-hidden flex items-center justify-center" style={{background: 'transparent'}}>
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
                                <h1 className="text-4xl font-bold text-gray-900">Panel de Cajero</h1>
                                <p className="text-2xl text-red-600 font-medium">Cajero {userId}</p>
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

                    {/* Filtros eliminados */}

                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="flex w-full">
                            <TabsTrigger
                            value="pending"
                            className="flex-1 text-2xl font-semibold text-center py-5 px-6 data-[state=active]:bg-red-600 data-[state=active]:text-white"
                            >
                            Turnos Pendientes ({getFilteredPendingShifts().length})
                            </TabsTrigger>

                            <TabsTrigger
                            value="reviewed"
                            className="flex-1 text-2xl font-semibold text-center py-5 px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                            >
                                Historial de la Semana ({getFilteredReviewedShifts().length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="w-full">
                            {getFilteredPendingShifts().length === 0 ? (
                                <Card className="border-gray-200 shadow-lg">
                                    <CardContent className="pt-6">
                                        <div className="text-center py-12 space-y-4">
                                            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto" />
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-medium text-gray-500">No existen turnos pendientes</h4>
                                                <p className="text-sm text-gray-400">Los nuevos turnos de repartidores aparecerán aquí</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4 w-full">
                                    {getFilteredPendingShifts().map((shift) => (
                                        <PendingShiftCard key={shift.id} shift={shift} onReview={handleReviewShift} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="reviewed" className="w-full">
                            {getFilteredReviewedShifts().length === 0 ? (
                                <Card className="border-gray-200 shadow-lg">
                                    <CardContent className="pt-6">
                                        <div className="text-center py-12 space-y-4">
                                            <Calendar className="h-16 w-16 text-gray-300 mx-auto" />
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-medium text-gray-500">No existen turnos revisados</h4>
                                                <p className="text-sm text-gray-400">El historial de la semana laboral aparecerá aquí</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4 w-full">
                                    {getFilteredReviewedShifts().map((shift) => (
                                        <ReviewedShiftCard key={shift.id} shift={shift} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AuthGuard>
    )
}

// ✅ Los componentes PendingShiftCard y ReviewedShiftCard permanecen exactamente iguales
function PendingShiftCard({ shift, onReview }: { shift: ShiftData; onReview: (id: string, notes: string, cashierNumber: string) => void }) {
    const [reviewNotes, setReviewNotes] = useState("")
    const [isReviewing, setIsReviewing] = useState(false)
    const [cashierNumber, setCashierNumber] = useState("")
    const [error, setError] = useState("")
    const [isExpanded, setIsExpanded] = useState(false)

    const handleReview = () => {
        if (!cashierNumber) {
            setError("Seleccione Número de Cajero")
            return
        }
        setError("")
        setIsReviewing(true)
        setTimeout(() => {
            onReview(shift.id, reviewNotes, cashierNumber)
            setIsReviewing(false)
            setReviewNotes("")
            setCashierNumber("")
        }, 500)
    }

    const handleCardClick = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <Card className="border-yellow-200 shadow-lg cursor-pointer" onClick={handleCardClick}>
            <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-50">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-yellow-700" />
                        Repartidor {shift.driverId}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                            Pendiente de Revisión
                        </Badge>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-yellow-700" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-yellow-700" />
                        )}
                    </div>
                </div>
                
                {/* Vista comprimida - siempre visible */}
                <div className="grid grid-cols-2 md:grid-cols-8 gap-2 text-sm text-gray-700">
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Fecha</p>
                        <p className="font-medium">{shift.date}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Horario</p>
                        <p className="font-medium">{shift.entryTime} - {shift.exitTime}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Horas</p>
                        <p className="font-medium">{shift.hoursWorked}h</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Pedidos</p>
                        <p className="font-medium">{shift.totalTickets}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Cobrado</p>
                        <p className="font-medium">{(shift.totalEarned ?? 0).toFixed(2)} €</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Caja neto</p>
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-lg border border-green-200">
                            <p className="font-bold text-sm">{(shift.totalCajaNeto ?? 0).toFixed(2)} €</p>
                        </div>
                    </div>
                    {shift.molaresOrders && (
                        <div className="text-center">
                            <p className="text-gray-500 text-xs">Molares</p>
                            <div className="bg-purple-600 text-white px-2 py-1 rounded-lg shadow-md">
                                <p className="font-bold text-xs">MOLARES</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            
            {/* Contenido expandible */}
            {isExpanded && (
                <CardContent className="space-y-6 p-6" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Pedidos a Domicilio</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {shift.homeDeliveryOrders ? shift.homeDeliveryOrders.replace(/,/g, ', ') : "Sin pedidos"}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Pedidos Online</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {shift.onlineOrders ? shift.onlineOrders.replace(/,/g, ', ') : "Sin pedidos"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Total Venta Pedidos</p>
                            <p className="text-lg font-semibold text-blue-600">{(shift.totalSalesPedidos ?? 0).toFixed(2)} €</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Total Datafono</p>
                            <p className="text-lg font-semibold text-blue-600">{(shift.totalDatafono ?? 0).toFixed(2)} €</p>
                        </div>
                        <div className="space-y-2 flex items-center gap-2">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Viaje a Molares</p>
                                <p className="text-lg font-semibold text-purple-600">{shift.molaresOrders ? "Sí (+1€)" : "No"}</p>
                            </div>
                            {shift.molaresOrders && shift.molaresOrderNumbers && (
                                <div className="ml-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                                    <span className="text-purple-700 font-medium">Pedidos: {shift.molaresOrderNumbers.replace(/,/g, ', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {shift.incidents && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800 mb-1">Incidencias Reportadas:</p>
                            <p className="text-sm text-yellow-700 whitespace-pre-wrap break-words">{shift.incidents}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor={`notes-${shift.id}`}>Observaciones del Cajero (opcional)</Label>
                        <Textarea
                            id={`notes-${shift.id}`}
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Ingrese observaciones de la revisión..."
                            rows={3}
                            className="bg-white border-red-200 focus:border-red-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Número de Cajero</Label>
                        <Select value={cashierNumber} onValueChange={setCashierNumber}>
                            <SelectTrigger
                                className={`bg-white text-base ${
                                    !cashierNumber && error ? 'border-red-500 focus:border-red-500' : ''
                                }`}
                                >
                                <SelectValue placeholder="Seleccione Número de Cajero" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => `${i + 1}`).map((n) => (
                                    <SelectItem key={n} value={n}>
                                    Cajero {n}
                                    </SelectItem>
                                ))}
                                <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {error && !cashierNumber && (
                            <p className="text-red-600 text-sm">Seleccione Número de Cajero</p>
                        )}
                    </div>

                    <Button
                        onClick={handleReview}
                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-medium"
                        disabled={isReviewing}
                    >
                        {isReviewing ? "Procesando revisión..." : "Confirmar revisión"}
                    </Button>
                </CardContent>
            )}
        </Card>
    )
}


function ReviewedShiftCard({ shift }: { shift: ShiftData }) {
    const getReviewTime = () => {
        if (!shift.reviewedAt) return ""
        const date = new Date(shift.reviewedAt)
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
    }

    const isUnreviewed = shift.status === "unreviewed"

    return (
        <Card className={`shadow-lg ${isUnreviewed ? 'border-yellow-200' : 'border-green-200'}`}>
            <CardHeader className={`${isUnreviewed ? 'bg-gradient-to-r from-yellow-100 to-yellow-50' : 'bg-gradient-to-r from-green-100 to-green-50'}`}>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <User className={`h-5 w-5 ${isUnreviewed ? 'text-yellow-700' : 'text-green-700'}`} />
                        Repartidor {shift.driverId}
                    </CardTitle>
                    <Badge variant="default" className={`${isUnreviewed ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                        {isUnreviewed ? 'Pendiente' : 'Revisado'}
                    </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm text-gray-600">
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Fecha</p>
                        <p className="font-medium">{shift.date}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Horario</p>
                        <p className="font-medium">{shift.entryTime} - {shift.exitTime}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Horas</p>
                        <p className={`font-medium ${isUnreviewed ? 'text-yellow-600' : 'text-green-600'}`}>{shift.hoursWorked}h</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Pedidos</p>
                        <p className={`font-medium ${isUnreviewed ? 'text-yellow-600' : 'text-green-600'}`}>{shift.totalTickets}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Revisado Por</p>
                        <p className="font-medium">{shift.reviewedBy}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">Hora de Revisión</p>
                        <p className="font-medium">{getReviewTime()}</p>
                    </div>
                </div>
            </CardHeader>
            {shift.reviewNotes && !isUnreviewed && (
  <CardContent className="p-0">
    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
      <p className="text-sm font-medium mb-1 text-blue-800">
        Observaciones del Cajero:
      </p>
      <p className="text-sm text-blue-700">{shift.reviewNotes}</p>
    </div>
  </CardContent>
)}

        </Card>
    )
}

