"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { User } from "lucide-react"

interface ActiveDriver {
  driverId: string
  homeDeliveryOrders: string
  onlineOrders: string
  molaresOrderNumbers?: string
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<"driver" | "cashier" | "admin">("driver")
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [error, setError] = useState("")

  // 🚀 Estados para repartidores activos
  const [showActive, setShowActive] = useState(false)
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([])

  const router = useRouter()

  // Selección de usuario repartidor
  const handleSelectUser = (id: string) => {
    setUsername(id)
    setPassword("")
    setError("")
  }

  // Autenticación Admin
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const u = (e.currentTarget as any).adminUser.value
    const p = (e.currentTarget as any).adminPass.value

    if (u === "Adminseki" && p === "Estambul2025@") {
      localStorage.setItem("userRole", "admin")
      localStorage.setItem("userId", "admin")
      router.push("/admin/dashboard")
    } else {
      setError("Credenciales admin incorrectas.")
    }
  }

  // Lectura de repartidores activos desde localStorage
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

  // Mapa de contraseñas de repartidor
  const driverMap: Record<string, string> = {
    "1": "56776", "2": "87554", "3": "33567", "4": "98295", "5": "23196",
    "6": "43078", "7": "19445", "8": "66513", "9": "76194", "10": "05068",
    "11": "69105", "12": "58321", "13": "43434", "14": "56565", "15": "78787",
    "16": "23232", "17": "09090", "18": "13131", "19": "00110", "20": "12312",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-md border-b border-red-200">
        <div
          className="w-18 h-18 bg-white rounded-full p-2 shadow-md cursor-pointer border border-red-200 flex items-center justify-center"
          onClick={() => setShowAdminForm(prev => !prev)}
          title="Acceso Admin"
        >
          <Image src="/Logo-Estambul.jpg" alt="Logo" width={80} height={80} className="rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-red-700">Control de Turnos</h1>
        <div className="w-12" />
        {showAdminForm && (
          <div className="absolute top-16 left-4 bg-white border border-red-200 rounded-lg shadow-lg p-4 w-64 z-10">
            <h2 className="text-lg font-bold text-red-700 mb-2">Acceso Admin</h2>
            <form onSubmit={handleAdminSubmit} className="space-y-2">
              <input name="adminUser" placeholder="Usuario" className="w-full border px-2 py-1 rounded" required />
              <input name="adminPass" type="password" placeholder="Contraseña" className="w-full border px-2 py-1 rounded" required />
              <Button type="submit" className="w-full bg-red-600">Ingresar</Button>
            </form>
          </div>
        )}
      </header>

      {/* Main */}
      <div className="flex flex-1 flex-col md:flex-row p-4 gap-4">
        {/* Izquierda: Selección de rol y usuario */}
        <div className="w-full md:w-1/2 bg-red-50 rounded-lg shadow-md border border-red-200 p-8 flex flex-col">
          <Label className="block text-center text-2xl md:text-3xl font-semibold text-red-700 mb-4">
            Seleccione su Rol
          </Label>
          <div className="inline-grid grid-cols-2 gap-6 mb-6">
            <button
              type="button"
              onClick={() => { setSelectedRole("driver"); setUsername(""); setPassword(""); setError("") }}
              className={`px-10 py-4 md:px-12 md:py-6 rounded-lg shadow-lg text-xl md:text-2xl ${
                selectedRole === "driver" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              REPARTIDOR
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole("cashier"); setUsername(""); setPassword(""); setError("") }}
              className={`px-10 py-4 md:px-12 md:py-6 rounded-lg shadow-lg text-xl md:text-2xl ${
                selectedRole === "cashier" ? "bg-red-600 text-white" : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              CAJERO
            </button>
          </div>

          {selectedRole === "driver" && (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-4 mb-6">
                {Array.from({ length: 15 }, (_, i) => (i + 1).toString()).map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectUser(id)}
                    className={`w-full aspect-square flex items-center justify-center rounded-lg shadow-lg ${
                      username === id ? "bg-blue-600 text-white" : "bg-white text-gray-800"
                    } text-[clamp(1.25rem,5vw,2rem)]`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedRole === "cashier" && (
            <Label className="mt-auto text-center font-medium">Ingrese contraseña</Label>
          )}
        </div>

        {/* Derecha: Teclado y contraseña */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md border border-red-200 p-8 flex flex-col">
          <Label className="block text-center text-2xl md:text-3xl font-semibold text-red-700 mb-4">
            Contraseña
          </Label>
          <input
            type="password"
            readOnly
            value={password.replace(/./g, "•")}
            placeholder="Ingrese su contraseña"
            className="border rounded-lg px-3 py-4 mb-6"
          />
          <div className="grid grid-cols-3 gap-1 mb-4">
            {["1","2","3","4","5","6","7","8","9"].map(k => (
              <button
                key={k}
                type="button"
                onPointerDown={() => {
                  const next = password + k
                  setPassword(next)
                  const expected =
                    selectedRole === "driver"
                      ? driverMap[username]
                      : selectedRole === "cashier"
                      ? "025"
                      : ""
                  if (next === expected && expected) {
                    localStorage.setItem("userRole", selectedRole)
                    localStorage.setItem("userId", selectedRole === "driver" ? username : "1")
                    router.push(
                      selectedRole === "driver" ? "/driver/dashboard" : "/cashier/dashboard"
                    )
                  } else if (expected && next.length >= expected.length) {
                    setError("Contraseña incorrecta. Intente de nuevo.")
                    setPassword("")
                  }
                }}
                onClick={() => {}}
                className="py-4 text-3xl bg-gray-100 rounded-lg active:bg-gray-200"
              >
                {k}
            </button>
            ))}
            <button
              type="button"
              onClick={() => setPassword(p => p.slice(0, -1))}
              className="py-4 text-2xl bg-red-100 rounded-lg active:bg-red-200"
            >
              BORRAR
            </button>
            <button
              type="button"
              onClick={() => setPassword(p => p + ",")}
              className="py-4 text-2xl bg-gray-100 rounded-lg active:bg-gray-200"
            >
              ,
            </button>
            <button
              type="button"
              onClick={() => setPassword(p => p + "0")}
              className="py-4 text-2xl bg-gray-100 rounded-lg active:bg-gray-200"
            >
              0
            </button>
          </div>
          
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {/* Botón Ver Repartidores Activos */}
            <div className="mt-4 flex justify-center">
              <Button
                onClick={fetchActiveFromLocal}
                variant="outline"
                className="px-8 py-6 text-lg border-blue-400 text-blue-700 hover:bg-blue-50"
              >
                <User className="w-5 h-5 mr-2" />
                Ver Repartidores Activos
              </Button>
            </div>
        </div>
      </div>

      {/* Modal de Repartidores Activos */}
      {showActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Cabecera */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-white rounded-t-xl">
              <h2 className="text-2xl font-bold text-red-700 flex items-center">
                <User className="w-6 h-6 mr-2" />
                Repartidores Activos
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActive(false)}
                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
              >
                ✕
              </Button>
            </div>
            {/* Contenido */}
            <div className="p-6">
              {activeDrivers.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {activeDrivers.map(d => {
                    const homeArr = d.homeDeliveryOrders.split(/\s*,\s*/).filter(Boolean)
                    const onlineArr = d.onlineOrders.split(/\s*,\s*/).filter(Boolean)
                    const molaresArr = d.molaresOrderNumbers
                      ? d.molaresOrderNumbers.split(/\s*,\s*/).filter(Boolean)
                      : []

                    return (
                      <div
                        key={d.driverId}
                        className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
                      >
                        {/* Header con icono */}
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center mr-3">
                            <User className="h-6 w-6 text-blue-700" />
                          </div>
                          <span className="font-bold text-lg text-blue-800">
                            Repartidor {d.driverId}
                          </span>
                        </div>

                        {/* 🏠 Domicilio */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center border-b border-gray-200 pb-1">
                            🏠 Domicilio
                          </h4>
                          <div className="text-center">
                            {homeArr.length > 0 ? (
                              <div className="flex flex-wrap justify-center gap-1">
                                {homeArr.map((num, i) => (
                                  <span
                                    key={i}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono"
                                  >
                                    {num}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">Sin pedidos</span>
                            )}
                          </div>
                        </div>

                        {/* 💻 Online */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center border-b border-gray-200 pb-1">
                            💻 Online
                          </h4>
                          <div className="text-center">
                            {onlineArr.length > 0 ? (
                              <div className="flex flex-wrap justify-center gap-1">
                                {onlineArr.map((num, i) => (
                                  <span
                                    key={i}
                                    className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono"
                                  >
                                    {num}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">Sin pedidos</span>
                            )}
                          </div>
                        </div>

                        {/* 🦷 Molares */}
                        {molaresArr.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center border-b border-gray-200 pb-1">
                              🦷 Molares
                            </h4>
                            <div className="text-center">
                              <div className="flex flex-wrap justify-center gap-1">
                                {molaresArr.map((num, i) => (
                                  <span
                                    key={i}
                                    className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-mono"
                                  >
                                    {num}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No hay repartidores activos en este momento</p>
                  <p className="text-gray-400 text-sm mt-2">Los repartidores aparecerán aquí cuando inicien sus turnos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



