
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
import { useRouter } from "next/navigation"
import { SessionManager } from "@/lib/session-manager"

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
	 * Panel de caja: gestión de turnos, revisión y exportación.
	 * Documentación de funciones principales para facilitar refactorización.
	 */
	const router = useRouter()
	const [userId, setUserId] = useState("")
	const [pendingShifts, setPendingShifts] = useState<ShiftData[]>([])
	const [reviewedShifts, setReviewedShifts] = useState<ShiftData[]>([])
	const [filterDate, setFilterDate] = useState("")
	const [filterDriver, setFilterDriver] = useState("")
	const [activeDrivers, setActiveDrivers] = useState<string[]>([])

	useEffect(() => {
		const validate = async () => {
			const id = localStorage.getItem("userId") || ""
			const token = localStorage.getItem("sessionToken") || ""
			if (!id || !token) {
				localStorage.clear()
				router.push("/login")
				return
			}
			const valid = await SessionManager.validateSession(id, token)
			if (!valid) {
				localStorage.clear()
				router.push("/login")
				return
			}
			setUserId(id)
			loadShifts()
			// Escuchar cambios en localStorage
			const handleStorageChange = () => {
				loadShifts()
			}
			window.addEventListener('storage', handleStorageChange)
			return () => {
				window.removeEventListener('storage', handleStorageChange)
			}
		}
		validate()
	}, [])

	useEffect(() => {
		const drivers: string[] = []
		for (let i = 1; i <= 12; i++) {
			const currentShift = localStorage.getItem(`currentShift_${i}`)
			if (currentShift) {
				drivers.push(i.toString())
			}
		}
		setActiveDrivers(drivers)
	}, [pendingShifts])

	/**
	 * Carga los turnos pendientes y revisados desde localStorage.
	 */
	const loadShifts = () => {
		try {
			// Cargar turnos pendientes desde localStorage
			const pending = JSON.parse(localStorage.getItem("pendingShifts") || "[]") as ShiftData[]
			const reviewed = JSON.parse(localStorage.getItem("reviewedShifts") || "[]") as ShiftData[]
			
			// Filtrar solo turnos pendientes
			setPendingShifts(pending.filter(shift => shift.status === "pending"))
			setReviewedShifts(reviewed)
		} catch {
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
	const handleReviewShift = (shiftId: string, reviewNotes: string, cashierNumber: string) => {
		const shiftToReview = pendingShifts.find((shift) => shift.id === shiftId)
		if (shiftToReview) {
			const reviewedShift: ShiftData = {
				...shiftToReview,
				status: "reviewed",
				reviewedBy: `Cajero ${cashierNumber}`,
				reviewedAt: new Date().toISOString(),
				reviewNotes,
			}

					// Actualizar el estado del repartidor
					const driverId = shiftToReview.driverId
					const driverShifts = JSON.parse(localStorage.getItem("driverShifts") || "{}")
					if (!driverShifts[driverId]) {
						driverShifts[driverId] = []
					}
					// Agregar el turno revisado a la lista del repartidor
					driverShifts[driverId].push({
						...reviewedShift,
						reviewedAt: new Date().toISOString(),
						reviewedBy: `Cajero ${cashierNumber}`,
					})
					localStorage.setItem("driverShifts", JSON.stringify(driverShifts))
					localStorage.setItem(`shiftSubmitted_${driverId}`, "false")
					// Eliminar el turno actual y borrador solo si no hay un nuevo turno pendiente
					localStorage.removeItem(`currentShift_${driverId}`)
					localStorage.removeItem(`currentShiftDraft_${driverId}`)
			// Actualizar repartidores activos
			const drivers: string[] = []
			for (let i = 1; i <= 12; i++) {
				const currentShift = localStorage.getItem(`currentShift_${i}`)
				if (currentShift) {
					drivers.push(i.toString())
				}
			}
			setActiveDrivers(drivers)

			setPendingShifts((prev) => prev.filter((shift) => shift.id !== shiftId))
			setReviewedShifts((prev) => {
				const updated = [reviewedShift, ...prev]
				try {
					const remaining = pendingShifts.filter((s) => s.id !== shiftId)
					localStorage.setItem("pendingShifts", JSON.stringify(remaining))
					localStorage.setItem("reviewedShifts", JSON.stringify(updated))
				} catch {}
				return updated
			})
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

			// Actualizar repartidores activos
			const drivers: string[] = []
			for (let i = 1; i <= 12; i++) {
				const currentShift = localStorage.getItem(`currentShift_${i}`)
				if (currentShift) {
					drivers.push(i.toString())
				}
			}
			setActiveDrivers(drivers)

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

	const getFilteredReviewedShifts = () => {
		const oneWeekAgo = new Date()
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

		return reviewedShifts.filter((shift) => {
			const shiftDate = new Date(shift.date)
			const isWithinWeek = shiftDate >= oneWeekAgo
			const matchesDate = !filterDate || shift.date === filterDate
			const matchesDriver = !filterDriver || shift.driverId.includes(filterDriver)
			return isWithinWeek && matchesDate && matchesDriver
		})
	}

	return (
		<AuthGuard requiredRole="cashier">
			<InactivityMonitor onLogout={handleLogout} timeoutSeconds={30} />
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
								<h1 className="text-3xl font-bold text-gray-900">Panel de Caja</h1>
								<p className="text-lg text-red-600 font-medium">Cajero {userId}</p>
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

					<div className="w-full bg-white rounded-2xl shadow-lg p-6 mb-8">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
							<div className="flex items-center gap-3">
								<User className="h-7 w-7 text-blue-600" />
								<span className="text-xl font-bold text-gray-900">Repartidores activos</span>
								<span className="ml-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-lg">{activeDrivers.length}</span>
							</div>
							<span className="text-base text-gray-500">Actualmente en reparto</span>
						</div>
						{activeDrivers.length > 0 ? (
							<div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
								{activeDrivers.map((id) => {
									const shiftRaw = typeof window !== 'undefined' ? localStorage.getItem(`currentShift_${id}`) : null
									let pedidosDomicilio = "Sin pedidos"
									let pedidosOnline = "Sin pedidos"
									let pedidosMolares = ""
									if (shiftRaw) {
										try {
											const shift: ShiftData = JSON.parse(shiftRaw)
											pedidosDomicilio = shift.homeDeliveryOrders || "Sin pedidos"
											pedidosOnline = shift.onlineOrders || "Sin pedidos"
											if (shift.molaresOrders && shift.molaresOrderNumbers) {
												pedidosMolares = ` | Molares: ${shift.molaresOrderNumbers}`
											}
										} catch {}
									}
									return (
										<div key={id} className="flex flex-col items-center justify-center min-h-[150px] bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl px-6 py-5 shadow-md overflow-hidden">
											<div className="w-14 h-14 rounded-full bg-blue-200 flex items-center justify-center mb-2">
												<User className="h-8 w-8 text-blue-700" />
											</div>
											<span className="font-bold text-blue-800 text-lg mb-1 truncate">Repartidor {id}</span>
											<div className="flex flex-col gap-1 w-full text-center">
												<span className="text-sm text-gray-700 truncate flex items-center justify-center gap-1"><Clock className="h-4 w-4 text-blue-400" /> Domicilio: <span className="font-mono text-blue-700 break-all">{pedidosDomicilio}</span></span>
												<span className="text-sm text-gray-700 truncate flex items-center justify-center gap-1"><Calendar className="h-4 w-4 text-blue-400" /> Online: <span className="font-mono text-blue-700 break-all">{pedidosOnline}</span></span>
												{pedidosMolares && (
													<span className="text-sm text-gray-700 truncate flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4 text-green-400" /> Molares: <span className="font-mono text-blue-700 break-all">{pedidosMolares.replace(' | Molares: ', '')}</span></span>
												)}
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<div className="text-gray-400 text-sm">No hay repartidores activos</div>
						)}
					</div>

					{/* Filtros eliminados */}

					<Tabs defaultValue="pending" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="pending" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
								Turnos Pendientes ({getFilteredPendingShifts().length})
							</TabsTrigger>
							<TabsTrigger value="reviewed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
								Historial ({getFilteredReviewedShifts().length})
							</TabsTrigger>
						</TabsList>

									<TabsContent value="pending" className="w-full">
										{getFilteredPendingShifts().length === 0 ? (
											<Card className="border-gray-200 shadow-lg">
												<CardContent className="pt-6">
													<div className="text-center py-12 space-y-4">
														<CheckCircle className="h-16 w-16 text-gray-300 mx-auto" />
														<div className="space-y-2">
															<h4 className="text-lg font-medium text-gray-500">No hay turnos pendientes</h4>
															<p className="text-sm text-gray-400">Los turnos enviados por repartidores aparecerán aquí</p>
														</div>
													</div>
												</CardContent>
											</Card>
										) : (
											<div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
															<h4 className="text-lg font-medium text-gray-500">No hay turnos revisados</h4>
															<p className="text-sm text-gray-400">El historial de la última semana aparecerá aquí</p>
														</div>
													</div>
												</CardContent>
											</Card>
										) : (
											<div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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

function PendingShiftCard({ shift, onReview }: { shift: ShiftData; onReview: (id: string, notes: string, cashierNumber: string) => void }) {
	const [reviewNotes, setReviewNotes] = useState("")
	const [isReviewing, setIsReviewing] = useState(false)
	const [cashierNumber, setCashierNumber] = useState("")
	const [error, setError] = useState("")
	const [isExpanded, setIsExpanded] = useState(false)

	const handleReview = () => {
		if (!cashierNumber) {
			setError("Selecciona el n.º de cajero")
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
						<p className="font-medium">{shift.totalEarned.toFixed(2)} €</p>
					</div>
					<div className="text-center">
						<p className="text-gray-500 text-xs">Caja neto</p>
						<div className="bg-green-100 text-green-800 px-2 py-1 rounded-lg border border-green-200">
							<p className="font-bold text-sm">{shift.totalCajaNeto.toFixed(2)} €</p>
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
								{shift.homeDeliveryOrders ? shift.homeDeliveryOrders.replace(/,/g, ', ') : "Ninguno"}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-gray-700">Pedidos Online</p>
							<p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
								{shift.onlineOrders ? shift.onlineOrders.replace(/,/g, ', ') : "Ninguno"}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<p className="text-sm font-medium text-gray-700">Total Venta Pedidos</p>
							<p className="text-lg font-semibold text-blue-600">{shift.totalSalesPedidos.toFixed(2)} €</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm font-medium text-gray-700">Total Datafono</p>
							<p className="text-lg font-semibold text-blue-600">{shift.totalDatafono.toFixed(2)} €</p>
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
							<p className="text-sm text-yellow-700">{shift.incidents}</p>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor={`notes-${shift.id}`}>Observaciones del cajero</Label>
						<Textarea
							id={`notes-${shift.id}`}
							value={reviewNotes}
							onChange={(e) => setReviewNotes(e.target.value)}
							placeholder="Agrega observaciones sobre la revisión..."
							rows={3}
							className="border-red-200 focus:border-red-500"
						/>
					</div>

					<div className="space-y-2">
						<Label>N.º de cajero</Label>
						<Select value={cashierNumber} onValueChange={setCashierNumber}>
							<SelectTrigger className={`text-base ${!cashierNumber && error ? 'border-red-500' : ''}`}>
								<SelectValue placeholder="Selecciona n.º de cajero" />
							</SelectTrigger>
							<SelectContent>
								{Array.from({ length: 12 }, (_, i) => `${i + 1}`).map((n) => (
									<SelectItem key={n} value={n}>Cajero {n}</SelectItem>
								))}
							</SelectContent>
						</Select>
						{error && !cashierNumber && <p className="text-red-600 text-sm">Selecciona el n.º de cajero</p>}
					</div>

					<Button
						onClick={handleReview}
						className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-medium"
						disabled={isReviewing}
					>
						{isReviewing ? "Confirmando revisión..." : "Confirmar revisión"}
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
						{isUnreviewed ? 'Sin Revisar' : 'Revisado'}
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
						<p className="text-gray-500 text-xs">Revisado por</p>
						<p className="font-medium">{shift.reviewedBy}</p>
					</div>
					<div className="text-center">
						<p className="text-gray-500 text-xs">Hora de Revisión</p>
						<p className="font-medium">{getReviewTime()}</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4 p-4">
				{shift.reviewNotes && !isUnreviewed && (
					<div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
						<p className="text-sm font-medium mb-1 text-blue-800">
							Observaciones del Cajero:
						</p>
						<p className="text-sm text-blue-700">{shift.reviewNotes}</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
