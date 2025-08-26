"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { InactivityMonitor } from "@/components/inactivity-monitor"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

// Helper: trunca texto a una longitud máxima
function truncate(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

interface MonthlyDriverData {
  driverId: string
  turnos: number
  horas: number
  tickets: number
  cobro: number
  incidencias: Array<{ fecha: string; texto: string }>
  observaciones: Array<{ fecha: string; texto: string }>
  rendimiento?: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const REPORT_EMAIL = "sstambul40@gmail.com"

  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [months, setMonths] = useState<string[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyDriverData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadAvailableMonths = async () => {
      const { data: shifts, error } = await supabase
        .from("driver_shifts")
        .select("date")
        .order("date", { ascending: false })
      if (error) return
      const unique = Array.from(
        new Set(
          shifts?.map((s) => {
            const d = new Date(s.date)
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          }) || []
        )
      ).sort((a, b) => b.localeCompare(a))
      setMonths(unique)
      if (!selectedMonth && unique.length) setSelectedMonth(unique[0])
    }
    loadAvailableMonths()
  }, [selectedMonth])

  useEffect(() => {
    if (!selectedMonth) return
    const loadData = async () => {
      setLoading(true)
      const [year, monthStr] = selectedMonth.split("-")
      const month = Number(monthStr)
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`
      const lastDay = new Date(Number(year), month, 0).toISOString().split("T")[0]

      const { data: shifts, error } = await supabase
        .from("driver_shifts")
        .select("*")
        .gte("date", startDate)
        .lte("date", lastDay)
        .eq("status", "reviewed")

      const grouped: Record<string, MonthlyDriverData> = {}
      shifts?.forEach((shift) => {
        const id = shift.driver_id || "N/A"
        if (!grouped[id]) {
          grouped[id] = { driverId: id, turnos: 0, horas: 0, tickets: 0, cobro: 0, incidencias: [], observaciones: [] }
        }
        const g = grouped[id]
        g.turnos++
        g.horas += Number(shift.hours_worked || 0)
        g.tickets += Number(shift.total_tickets || 0)
        g.cobro += Number(shift.total_earned || 0)
        if (shift.incidents) g.incidencias.push({ fecha: shift.date, texto: shift.incidents })
        if (shift.review_notes) g.observaciones.push({ fecha: shift.date, texto: shift.review_notes })
      })

      setMonthlyData(
        Object.values(grouped).map((r) => ({
          ...r,
          rendimiento: r.horas > 0 ? Number((r.cobro / r.horas).toFixed(2)) : 0,
        }))
      )
      setLoading(false)
    }
    loadData()
  }, [selectedMonth])

  // Generar CSV con saltos de línea y truncado
  const generateCSV = () => {
    let csv = "Número Repartidor,Turnos,Horas,Tickets,Cobro,Rendimiento,Incidencias,Observaciones\n"
    monthlyData.forEach((r) => {
      const incText = r.incidencias
        .map((i) => `${i.fecha}: ${truncate(i.texto, 15)}`)
        .join("\n")
      const obsText = r.observaciones
        .map((o) => `${o.fecha}: ${truncate(o.texto, 15)}`)
        .join("\n")

      csv += `${r.driverId},${r.turnos},${r.horas},${r.tickets},${r.cobro.toFixed(2)},${r.rendimiento?.toFixed(2) || ""},`
      csv += `"${incText}",`
      csv += `"${obsText}"\n`
    })
    return csv
  }

  // Generar PDF con multilínea en celdas
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
    doc.setFontSize(16)
    doc.text(`Resumen Mensual: ${selectedMonth}`, 40, 40)
    doc.setFontSize(10)

    const columns = ["Número Repartidor","Turnos","Horas","Tickets","Cobro","Rendimiento","Incidencias","Observaciones"]
    const rows = monthlyData.map((r) => [
      r.driverId,
      r.turnos,
      r.horas.toFixed(1),
      r.tickets,
      `€${r.cobro.toFixed(2)}`,
      r.rendimiento ? `€${r.rendimiento.toFixed(2)}` : "–",
      r.incidencias.map((i) => `${i.fecha}: ${truncate(i.texto, 15)}`).join("\n"),
      r.observaciones.map((o) => `${o.fecha}: ${truncate(o.texto, 15)}`).join("\n"),
    ])

    autoTable(doc, {
      startY: 60,
      head: [columns],
      body: rows,
      theme: "grid",
      styles: { cellPadding: 4, fontSize: 8, cellWidth: "wrap", overflow: "linebreak" },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40, top: 60 },
      columnStyles: { 6: { cellWidth: 120 }, 7: { cellWidth: 120 } },
    })

    return doc
  }

  const handleSendReport = async (fmt: "excel" | "pdf") => {
    if (!selectedMonth) return
    setLoading(true)
    try {
      let attachment: { filename: string; content: string; type: string }
      if (fmt === "excel") {
        attachment = { filename: `reporte-${selectedMonth}.csv`, content: generateCSV(), type: "text/csv" }
      } else {
        const doc = generatePDF()
        attachment = { filename: `reporte-${selectedMonth}.pdf`, content: doc.output("datauristring").split(",")[1], type: "application/pdf" }
      }
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: REPORT_EMAIL, subject: `Reporte ${selectedMonth}`, attachment }),
      })
      alert("Reporte enviado exitosamente")
    } catch {
      alert("Error al enviar el reporte")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userId")
    router.push("/login")
  }

  return (
    <AuthGuard>
      <InactivityMonitor onLogout={handleLogout} timeoutSeconds={30} />

      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-red-50 to-white p-8">
        <div className="flex items-center justify-between w-full max-w-6xl mb-8">
          <div className="flex items-center gap-4">
            <Image src="/Logo-Estambul.jpg" alt="Logo" width={64} height={64} className="rounded-full border border-red-200" />
            <h1 className="text-3xl font-bold text-red-700">Panel Administrativo</h1>
          </div>
          <Button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border shadow">
            <LogOut className="h-4 w-4 mr-1" /> Cerrar Sesión
          </Button>
        </div>

        <div className="flex justify-end w-full max-w-6xl gap-4 mb-6">
          <Button onClick={() => handleSendReport("excel")} disabled={loading} className="bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 px-4 py-2 rounded border shadow">
            Enviar Excel
          </Button>
          <Button onClick={() => handleSendReport("pdf")} disabled={loading} className="bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-700 px-4 py-2 rounded border shadow">
            Enviar PDF
          </Button>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-xl shadow border p-6 overflow-x-auto">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-red-700">Resumen Mensual:</h2>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border rounded px-2 py-1">
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="bg-red-50 text-red-700">
                  <th className="p-2 w-1/12">Número Repartidor</th>
                  <th className="p-2 w-1/12">Turnos</th>
                  <th className="p-2 w-1/12">Horas</th>
                  <th className="p-2 w-1/12">Tickets</th>
                  <th className="p-2 w-1/12">Cobro</th>
                  <th className="p-2 w-1/12">Rendimiento<br/>(€ / h)</th>
                  <th className="p-2 w-3/12 hidden md:table-cell">Incidencias</th>
                  <th className="p-2 w-3/12 hidden md:table-cell">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-red-50">
                    <td className="p-2 text-center font-bold text-blue-700">{r.driverId}</td>
                    <td className="p-2 text-center">{r.turnos}</td>
                    <td className="p-2 text-center">{r.horas.toFixed(1)}h</td>
                    <td className="p-2 text-center">{r.tickets}</td>
                    <td className="p-2 text-center text-green-700">€{r.cobro.toFixed(2)}</td>
                    <td className="p-2 text-center text-blue-700 font-semibold">{r.rendimiento!==undefined?`€${r.rendimiento.toFixed(2)}`:"–"}</td>
                    <td className="p-2 hidden md:table-cell align-top">
                      <div className="max-h-24 overflow-y-auto space-y-2 text-xs">
                        {r.incidencias.map((inc,j)=>(<div key={j} className="mb-2 p-2 bg-yellow-50 rounded"><p className="font-semibold text-yellow-800 text-[10px]">{inc.fecha}</p><p className="break-words pl-1">{inc.texto}</p></div>))}
                      </div>
                    </td>
                    <td className="p-2 hidden md:table-cell align-top">
                      <div className="max-h-24 overflow-y-auto space-y-2 text-xs">
                        {r.observaciones.map((obs,j)=>(<div key={j} className="mb-2 p-2 bg-blue-50 rounded"><p className="font-semibold text-blue-800 text-[10px]">{obs.fecha}</p><p className="break-words pl-1">{obs.texto}</p></div>))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

