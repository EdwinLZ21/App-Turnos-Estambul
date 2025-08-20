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
  const [selectedRole, setSelectedRole] = useState<"driver" | "cashier" | "">("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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
      }

      // Store user session
      localStorage.setItem("userRole", userRole)
      localStorage.setItem("userId", userId)

      // Redirect based on role
      if (userRole === "cashier") {
        router.push("/cashier/dashboard")
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full p-2 shadow-md">
              <Image
                src="/estambul-logo.jpg"
                alt="Estambul Kebab"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Estambul Kebab</CardTitle>
              <CardDescription className="text-red-100">Control de Turnos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Selecciona tu rol</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={selectedRole === "driver" ? "default" : "outline"}
                  className={`h-12 ${
                    selectedRole === "driver"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "border-red-200 hover:bg-red-50"
                  }`}
                  onClick={() => setSelectedRole("driver")}
                >
                  REPARTIDOR
                </Button>
                <Button
                  type="button"
                  variant={selectedRole === "cashier" ? "default" : "outline"}
                  className={`h-12 ${
                    selectedRole === "cashier"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "border-red-200 hover:bg-red-50"
                  }`}
                  onClick={() => setSelectedRole("cashier")}
                >
                  CAJERO
                </Button>
              </div>
            </div>

            {selectedRole !== "cashier" && (
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Número de usuario"
                  className="border-red-200 focus:border-red-500"
                  required={selectedRole === "driver"}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={selectedRole === "cashier" ? "•••" : "••••••••"}
                className="border-red-200 focus:border-red-500"
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
              className="w-full bg-red-600 hover:bg-red-700 h-12 text-base font-medium"
              disabled={isLoading || !selectedRole}
            >
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
          {/* Removed test credentials block */}
        </CardContent>
      </Card>
    </div>
  )
}
