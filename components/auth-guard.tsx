"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "driver" | "cashier"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    const userId = localStorage.getItem("userId")

    if (!userRole || !userId) {
      router.replace("/login")
      setIsAuthenticated(false)
      setIsLoading(false)
      return
    }

    if (requiredRole && userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on actual role
      if (userRole === "cashier") {
        router.replace("/cashier/dashboard")
      } else {
        router.replace("/driver/dashboard")
      }
      setIsAuthenticated(false)
      setIsLoading(false)
      return
    }

    setIsAuthenticated(true)
    setIsLoading(false)
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
