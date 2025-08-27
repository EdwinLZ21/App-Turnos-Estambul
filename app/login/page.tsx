  "use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Clock, CheckCircle } from "lucide-react"

interface ActiveDriver {
  driverId: string
  homeDeliveryOrders: string
  onlineOrders: string
  molaresOrderNumbers?: string
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<"driver" | "cashier" | "admin" | "">("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminUser, setAdminUser] = useState("")
  const [adminPass, setAdminPass] = useState("")
  const [adminError, setAdminError] = useState("")
  const [adminLoading, setAdminLoading] = useState(false)


  
  // 🚀 NUEVOS HOOKS PARA REPARTIDORES ACTIVOS
  const [showActive, setShowActive] = useState(false)
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([])

  const router = useRouter()

    // 🚀 NUEVA FUNCIÓN PARA LEER REPARTIDORES ACTIVOS
  const fetchActiveFromLocal = () => {
    const drivers: ActiveDriver[] = []
    for (let i = 1; i <= 20; i++) {
      const raw = localStorage.getItem(`currentShift_${i}`)
      if (!raw) continue
      try {
        const shift = JSON.parse(raw) as {
          homeDeliveryOrders: string
          onlineOrders: string
          molaresOrderNumbers: string
          molaresOrders: boolean
        }
        drivers.push({
          driverId: i.toString(),
          homeDeliveryOrders: shift.homeDeliveryOrders || "Sin pedidos",
          onlineOrders: shift.onlineOrders || "Sin pedidos",
          molaresOrderNumbers: shift.molaresOrders ? shift.molaresOrderNumbers : undefined,
        })
      } catch {
        // Ignorar draft corrupto
      }
    }
    setActiveDrivers(drivers)
    setShowActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate authentication
    try {
      if (!selectedRole) {
        setError("Por favor, seleccione un Rol.")
        return
      }

      let userRole = ""
      let userId = ""

      if (selectedRole === "driver") {
        const driverPasswords: Record<string, string> = {
          "1": "56776",
          "2": "87554",
          "3": "33567",
          "4": "98295",
          "5": "23196",
          "6": "43078",
          "7": "19445",
          "8": "66513",
          "9": "76194",
          "10": "05068",
          "11": "69105",
          "12": "58321",
          "13": "43434",
          "14": "56565",
          "15": "78787",
          "16": "23232",
          "17": "09090",
          "18": "13131",
          "19": "00110",
          "20": "12312",
        }

        if (!username || !password) {
          setError("Ingrese Usuario y Contraseña.")
          return
        }

        if (driverPasswords[username] && driverPasswords[username] === password) {
          userRole = "driver"
          userId = username
        } else {
          setError("Usuario, Contraseña o Rol incorrectos.")
          return
        }
      } else if (selectedRole === "cashier") {
        if (!password) {
          setError("Ingrese la Contraseña.")
          return
        }
        if (password === "025") {
          userRole = "cashier"
          userId = "1"
        } else {
          setError("Contraseña incorrecta.")
          return
        }
      } else if (selectedRole === "admin") {
        if (username === "Adminseki" && password === "Estambul2025@") {
          userRole = "admin"
          userId = "admin"
        } else {
          setError("Usuario o Contraseña de Admin incorrectos.")
          return
        }
      }

      // Store user session
      localStorage.setItem("userRole", userRole)
      localStorage.setItem("userId", userId)

      // Redirect based on role
      if (userRole === "cashier") {
        router.push("/cashier/dashboard")
      } else if (userRole === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/driver/dashboard")
      }
    } catch (err) {
      setError("Error de autenticación. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex flex-col items-center p-0">
      {/* Barra superior con logo y acceso admin */}
      <div className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-md border-b border-red-200">
        <div className="grid grid-cols-3 items-center w-full relative">
          <div className="flex items-center relative">
            <div className="w-16 h-16 bg-white rounded-full p-2 shadow-md cursor-pointer border border-red-200 flex items-center justify-center"
              onClick={() => setShowAdminForm((prev) => !prev)}
              title="Acceso de Admin"
            >
              <Image
                src="/Logo-Estambul.jpg"
                alt="Logo Estambul"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-full border border-red-200"
                style={{background: 'transparent', objectFit: 'cover', borderRadius: '50%'}}
              />
            </div>
            {showAdminForm && (
              <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-red-200 rounded-xl shadow-lg p-4 w-64 animate-fade-in flex flex-col items-center">
                <h2 className="text-lg font-bold text-red-700 mb-2">Acceso de Admin</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    // Autenticación admin separada
                    if (adminUser === "Adminseki" && adminPass === "Estambul2025@") {
                      localStorage.setItem("userRole", "admin")
                      localStorage.setItem("userId", "admin")
                      setShowAdminForm(false)
                      router.push("/admin/dashboard")
                    } else {
                      setAdminError("Usuario o Contraseña de Admin incorrectos.")
                    }
                  }}
                  className="w-full space-y-2"
                >
                  <Input
                    id="admin-user"
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="Usuario Admin"
                    className="border-red-200 focus:border-red-500"
                    required
                  />
                  <Input
                    id="admin-pass"
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Contraseña"
                    className="border-red-200 focus:border-red-500"
                    required
                  />
                  {adminError && (
                    <Alert variant="destructive">
                      <AlertDescription>{adminError}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 h-10 text-base font-medium">
                    Ingresar como Admin
                  </Button>
                </form>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold tracking-wide text-red-700 text-center">Control de Turnos</h1>
          </div>
          <div></div>
        </div>
      </div>
      {/* Mini formulario admin desplegable */}
      {/* Panel principal login sin panel izquierdo */}
<div className="w-full max-w-md sm:max-w-lg lg:max-w-xl bg-white rounded-lg shadow-md border border-red-200 mt-8">

  <div className="flex flex-col justify-center items-center w-full p-8">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-2 text-center">
              <Label className="block text-2xl font-semibold mb-2 text-red-700 px-4 py-2">Seleccione su Rol</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedRole === "driver" ? "default" : "outline"}
                  className={`h-10 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    selectedRole === "driver"
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow"
                      : "border-red-200 hover:bg-red-50 text-red-700 bg-white"
                  }`}
                  onClick={() => setSelectedRole("driver")}
                >
                  REPARTIDOR
                </Button>
                <Button
                  type="button"
                  variant={selectedRole === "cashier" ? "default" : "outline"}
                  className={`h-10 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    selectedRole === "cashier"
                      ? "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow"
                      : "border-red-200 hover:bg-red-50 text-red-700 bg-white"
                  }`}
                  onClick={() => setSelectedRole("cashier")}
                >
                  CAJERO
                </Button>
              </div>
            </div>

            {selectedRole !== "cashier" && (
              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Número de Usuario"
                  className="border border-red-200 focus:border-red-500 rounded-lg px-3 py-2 text-sm"
                  required={selectedRole === "driver"}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={selectedRole === "cashier" ? "•••" : "••••••••"}
                className="border border-red-200 focus:border-red-500 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 h-10 text-base font-semibold rounded-lg shadow transition-all duration-150"
              disabled={isLoading || !selectedRole}
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
          {/* Removed test credentials block */}

          {/* 🚀 BOTÓN PARA VER REPARTIDORES ACTIVOS */}
          <div className="mt-6 text-center w-full">
            <Button onClick={fetchActiveFromLocal} variant="outline">
              Ver Repartidores Activos
            </Button>
          </div>

          {/* 🚀 MODAL PARA VER REPARTIDORES ACTIVOS */}
          {showActive && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-[1200px] max-h-[90vh] overflow-y-auto">
                
                {/* Cabecera: título centrado + botón de cerrar */}
                <div className="sticky top-0 z-10 flex items-center justify-center p-4 border-b bg-white">
                  <h2 className="text-lg font-semibold">Repartidores Activos</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActive(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0">
                    ✕
                  </Button>
                </div>

                {/* Grilla de tarjetas */}
                <div className="p-6">
                  {activeDrivers.length > 0 ? (
                    <div
                      className="
                        grid 
                        gap-6 
                        grid-cols-[repeat(auto-fit,minmax(260px,1fr))] 
                        justify-center
                      "
                    >
                      {activeDrivers.map((d) => {
                        const homeArr = d.homeDeliveryOrders.split(/\s*,\s*/).filter(Boolean)
                        const onlineArr = d.onlineOrders.split(/\s*,\s*/).filter(Boolean)
                        const molaresArr = d.molaresOrderNumbers
                          ? d.molaresOrderNumbers.split(/\s*,\s*/).filter(Boolean)
                          : []

                        return (
                          <div
                            key={d.driverId}
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl shadow-lg"
                          >
                            {/* Icono y nombre */}
                            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center mb-3">
                              <User className="h-6 w-6 text-blue-700" />
                            </div>
                            <span className="font-semibold text-blue-800 text-base mb-4">
                              Repartidor {d.driverId}
                            </span>

                            {/* Domicilio */}
                            <div className="w-full mb-3 text-center">
                              <p className="text-sm text-gray-700 font-medium mb-1">Domicilio:</p>
                              <div className="flex flex-wrap justify-center gap-1">
                                {homeArr.map((num, i) => (
                                  <span key={i} className="text-sm font-mono text-blue-700 whitespace-nowrap">
                                    {num}{i < homeArr.length - 1 ? "," : ""}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Online */}
                            <div className="w-full mb-3 text-center">
                              <p className="text-sm text-gray-700 font-medium mb-1">Online:</p>
                              <div className="flex flex-wrap justify-center gap-1">
                                {onlineArr.map((num, i) => (
                                  <span key={i} className="text-sm font-mono text-blue-700 whitespace-nowrap">
                                    {num}{i < onlineArr.length - 1 ? "," : ""}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Molares */}
                            {molaresArr.length > 0 && (
                              <div className="w-full text-center">
                                <p className="text-sm text-gray-700 font-medium mb-1">Molares:</p>
                                <div className="flex flex-wrap justify-center gap-1">
                                  {molaresArr.map((num, i) => (
                                    <span key={i} className="text-sm font-mono text-blue-700 whitespace-nowrap">
                                      {num}{i < molaresArr.length - 1 ? "," : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No hay Repartidores Activos.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
    )
  }
