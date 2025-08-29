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
    "1": "567", "2": "875", "3": "335", "4": "982", "5": "231",
    "6": "430", "7": "194", "8": "665", "9": "761", "10": "050",
    "11": "691", "12": "583", "13": "434", "14": "565", "15": "787",
    "16": "232", "17": "090", "18": "131", "19": "091", "20": "123",
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
<div className="inline-grid grid-cols-2 gap-4 mb-6 min-w-0">
  <button
    type="button"
    onClick={() => { setSelectedRole("driver"); setUsername(""); setPassword(""); setError("") }}
    className={`
      w-full h-16
      flex items-center justify-center
      px-[clamp(1rem,4vw,2rem)]
      py-[clamp(0.75rem,2.5vw,1.5rem)]
      rounded-lg shadow-lg
      whitespace-nowrap
      text-[clamp(1rem,3.5vw,1.5rem)]
      font-semibold
      transition-colors
      ${selectedRole === "driver"
        ? "bg-blue-600 text-white"
        : "bg-white text-gray-700 border border-gray-300"}
    `}
  >
    REPARTIDOR
  </button>
  <button
    type="button"
    onClick={() => { setSelectedRole("cashier"); setUsername(""); setPassword(""); setError("") }}
    className={`
      w-full h-16
      flex items-center justify-center
      px-[clamp(1rem,4vw,2rem)]
      py-[clamp(0.75rem,2.5vw,1.5rem)]
      rounded-lg shadow-lg
      whitespace-nowrap
      text-[clamp(1rem,3.5vw,1.5rem)]
      font-semibold
      transition-colors
      ${selectedRole === "cashier"
        ? "bg-red-600 text-white"
        : "bg-white text-gray-700 border border-gray-300"}
    `}
  >
    CAJERO
  </button>
</div>



        {selectedRole === "driver" && (
          <>
<div className="grid grid-cols-5 gap-2 mb-2">
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
          <Label className="mt-auto text-center font-medium"></Label>
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
          const next = password + k;
          setPassword(next);
          const expected =
            selectedRole === "driver"
              ? driverMap[username]
              : selectedRole === "cashier"
              ? "025"
              : "";
          if (next === expected && expected) {
            localStorage.setItem("userRole", selectedRole);
            localStorage.setItem("userId", selectedRole === "driver" ? username : "1");
            router.push(
              selectedRole === "driver" ? "/driver/dashboard" : "/cashier/dashboard"
            );
          } else if (expected && next.length >= expected.length) {
            setError("Contraseña incorrecta. Intente de nuevo.");
            setPassword("");
          }
        }}
        onClick={() => {}}
        className="py-[clamp(0.1rem,0.1vw,1rem)] text-[clamp(1rem,3vw,4rem)] bg-gray-100 rounded-lg active:bg-gray-200"
      >
        {k}
      </button>
    ))}
    <button
      type="button"
      onClick={() => setPassword(p => p.slice(0, -1))}
      className="py-[clamp(0.1rem,0.1vw,1rem)] text-[clamp(1rem,2vw,4rem)] bg-red-100 rounded-lg active:bg-red-200"
    >
      BORRAR
    </button>
    <button
      type="button"
      onClick={() => setPassword(p => p + ",")}
      className="py-[clamp(0.1rem,0.1vw,1rem)] text-[clamp(1rem,3vw,4rem)] bg-gray-100 rounded-lg active:bg-gray-200"
    >
      ,
    </button>
    {/* Botón 0 corregido */}
    <button
      type="button"
      onPointerDown={() => {
        const next = password + "0";
        setPassword(next);
        const expected =
          selectedRole === "driver"
            ? driverMap[username]
            : selectedRole === "cashier"
            ? "025"
            : "";
        if (next === expected && expected) {
          localStorage.setItem("userRole", selectedRole);
          localStorage.setItem("userId", selectedRole === "driver" ? username : "1");
          router.push(
            selectedRole === "driver" ? "/driver/dashboard" : "/cashier/dashboard"
          );
        } else if (expected && next.length >= expected.length) {
          setError("Contraseña incorrecta. Intente de nuevo.");
          setPassword("");
        }
      }}
      className="py-[clamp(0.1rem,0.1vw,1rem)] text-[clamp(1rem,3vw,4rem)] bg-gray-100 rounded-lg active:bg-gray-200"
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
          className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          ✕
        </Button>
      </div>
      {/* Grilla de tarjetas */}
      <div className="p-6">
        {activeDrivers.length > 0 ? (
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))] justify-center">
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
                        <span
                          key={i}
                          className="text-2xl font-mono text-blue-700 whitespace-nowrap"
                        >
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
                        <span
                          key={i}
                          className="text-2xl font-mono text-blue-700 whitespace-nowrap"
                        >
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
                          <span
                            key={i}
                            className="text-2xl font-mono text-blue-700 whitespace-nowrap"
                          >
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
          <p className="text-center text-gray-500">No hay repartidores activos en este momento</p>
        )}
      </div>
    </div>
  </div>
)}

  </div>
)
}

