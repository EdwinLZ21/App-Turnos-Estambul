"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const userRole = localStorage.getItem("userRole")

    if (userRole === "cashier") {
      router.push("/cashier/dashboard")
    } else if (userRole === "driver") {
      router.push("/driver/dashboard")
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  )
}
