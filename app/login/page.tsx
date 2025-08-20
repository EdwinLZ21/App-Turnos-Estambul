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

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<"driver" | "cashier" | "admin" | "">("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [adminUser, setAdminUser] = useState("")
  const [adminPass, setAdminPass] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate authentication
    try {
      if (!selectedRole) {
        setError("Por favor, selecciona un rol")
        return
      }

      let userRole = ""
      let userId = ""

      if (selectedRole === "driver") {
        const driverPasswords: Record<string, string> = {
          "1": "56789",
          "2": "87654",
          "3": "34567",
          "4": "98765",
          "5": "23456",
          "6": "45678",
          "7": "12345",
          "8": "76543",
          "9": "11112",
          "10": "99998",
          "11": "44445",
          "12": "12321",
        }

        if (!username || !password) {
          setError("Ingresa usuario y contraseña")
          return
        }

        if (driverPasswords[username] && driverPasswords[username] === password) {
          userRole = "driver"
          userId = username
        } else {
          setError("Usuario, contraseña o rol incorrectos")
          return
        }
      } else if (selectedRole === "cashier") {
        if (!password) {
          setError("Ingresa la contraseña")
          return
        }
        if (password === "002") {
          userRole = "cashier"
          userId = "1"
        } else {
          setError("Contraseña incorrecta")
          return
        }
      } else if (selectedRole === "admin") {
        if (username === "admin" && password === "12345") {
          userRole = "admin"
          userId = "admin"
        } else {
          setError("Usuario o contraseña de admin incorrectos")
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
      setError("Error de autenticación. Intenta nuevamente.")
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
              title="Acceso Admin"
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
                <h2 className="text-lg font-bold text-red-700 mb-2">Acceso Admin</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSelectedRole("admin")
                    setUsername(adminUser)
                    setPassword(adminPass)
                    handleSubmit(e)
                  }}
                  className="w-full space-y-2"
                >
                  <Input
                    id="admin-user"
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="Usuario admin"
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
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg flex flex-col overflow-hidden border border-red-200 mt-8" style={{minHeight: '600px', alignItems: 'center', justifyContent: 'center'}}>
  {/* Solo formulario de login mejorado visualmente */}
  <div className="flex flex-col justify-center items-center w-full mx-auto rounded-lg shadow-md border border-red-100 p-6" style={{marginTop: '0', maxWidth: '360px', background: 'transparent'}}>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-2">
              <Label className="text-base font-semibold mb-1 text-red-700">Selecciona tu rol</Label>
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
                  placeholder="Número de usuario"
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
        </div>
      </div>
    </div>
    )
  }
