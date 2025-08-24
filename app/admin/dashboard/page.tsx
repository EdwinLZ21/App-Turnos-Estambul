"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"

interface MonthlyDriverData {
  driverId: string
  turnos: number
  horas: number
  tickets: number
  cobro: number
  incidencias: Array<{ fecha: string; texto: string }>
  observaciones: Array<{ fecha: string; texto: string }>
}

export default function AdminDashboard() {
  const router = useRouter()
  const REPORT_EMAIL = "sstambul40@gmail.com"

  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [months, setMonths] = useState<string[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyDriverData[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar meses disponibles desde la base de datos
  useEffect(() => {
    const loadAvailableMonths = async () => {
      try {
        const { data: shifts, error } = await supabase
          .from('driver_shifts')
          .select('date')
          .order('date', { ascending: false })

        if (error) {
          console.error('Error loading months:', error)
          return
        }

        const uniqueMonths = Array.from(
          new Set(
            shifts?.map(shift => {
              const d = new Date(shift.date)
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            }) || []
          )
        ).sort((a, b) => b.localeCompare(a))

        setMonths(uniqueMonths)
        if (!selectedMonth && uniqueMonths.length > 0) {
          setSelectedMonth(uniqueMonths[0])
        }
      } catch (error) {
        console.error('Error loading available months:', error)
      }
    }

    loadAvailableMonths()
  }, [])

  // Cargar datos mensuales desde la base de datos
  useEffect(() => {
    if (!selectedMonth) return

    const loadMonthlyData = async () => {
      setLoading(true)
      try {
        const [year, month] = selectedMonth.split('-')
        const startDate = `${year}-${month}-01`
        const endDate = `${year}-${month}-31`

        const { data: shifts, error } = await supabase
          .from('driver_shifts')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('status', 'reviewed')

        if (error) {
          console.error('Error loading monthly data:', error)
          return
        }

        const grouped: { [id: string]: MonthlyDriverData } = {}

        shifts?.forEach(shift => {
          const driverId = shift.driver_id || 'N/A'
          if (!grouped[driverId]) {
            grouped[driverId] = {
              driverId,
              turnos: 0,
              horas: 0,
              tickets: 0,
              cobro: 0,
              incidencias: [],
              observaciones: []
            }
          }
          grouped[driverId].turnos++
          grouped[driverId].horas += Number(shift.hours_worked || 0)
          grouped[driverId].tickets += Number(shift.total_tickets || 0)
          grouped[driverId].cobro += Number(shift.total_earned || 0)
          if (shift.incidents) {
            grouped[driverId].incidencias.push({ fecha: shift.date, texto: shift.incidents })
          }
          if (shift.review_notes) {
            grouped[driverId].observaciones.push({ fecha: shift.date, texto: shift.review_notes })
          }
        })

        setMonthlyData(Object.values(grouped))
      } catch (error) {
        console.error('Error loading monthly data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMonthlyData()
  }, [selectedMonth])

  // Generar CSV
  const generateCSV = () => {
    let csv = "Nro Repartidor,Turnos,Horas,Tickets,Cobro,Incidencias,Observaciones\n"
    monthlyData.forEach(row => {
      csv += `${row.driverId},${row.turnos},${row.horas},${row.tickets},${row.cobro.toFixed(2)},`
      csv += `"${row.incidencias.map(i => `${i.fecha}: ${i.texto}`).join(' | ')}",`
      csv += `"${row.observaciones.map(o => `${o.fecha}: ${o.texto}`).join(' | ')}"\n`
    })
    return csv
  }

  // Generar PDF
  const generatePDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Resumen Mensual: ${selectedMonth}`, 14, 18)
    doc.setFontSize(10)
    const columns = [
      "Nro Repartidor", "Turnos", "Horas", "Tickets", "Cobro", "Incidencias", "Observaciones"
    ]
    const rows = monthlyData.map(row => [
      row.driverId,
      row.turnos,
      row.horas,
      row.tickets,
      `€${row.cobro.toFixed(2)}`,
      row.incidencias.map(i => `${i.fecha}: ${i.texto}`).join(' | '),
      row.observaciones.map(o => `${o.fecha}: ${o.texto}`).join(' | ')
    ])
    autoTable(doc, {
      startY: 28,
      head: [columns],
      body: rows,
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 237, 213] },
      margin: { left: 10, right: 10 }
    })
    return doc
  }

  // Enviar reporte por correo
  const handleSendReport = async (format: "excel" | "pdf") => {
    if (!selectedMonth) return
    setLoading(true)
    try {
      let attachment: { filename: string; content: string; type: string }
      if (format === "excel") {
        const csv = generateCSV()
        attachment = {
          filename: `reporte-mensual-${selectedMonth}.csv`,
          content: csv,
          type: "text/csv"
        }
      } else {
        const doc = generatePDF()
        const pdfBase64 = doc.output("datauristring").split(",")[1]
        attachment = {
          filename: `reporte-mensual-${selectedMonth}.pdf`,
          content: pdfBase64,
          type: "application/pdf"
        }
      }
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: REPORT_EMAIL,
          subject: `Reporte mensual ${selectedMonth}`,
          attachment
        })
      })
      if (!res.ok) throw new Error("Error al enviar el correo")
      alert(`Reporte ${format.toUpperCase()} enviado a ${REPORT_EMAIL}`)
    } catch (error) {
      console.error(error)
      alert("Error al enviar el correo. Inténtalo nuevamente.")
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
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-red-50 to-white p-8">
      <div className="flex items-center gap-4 mb-8 w-full max-w-6xl justify-between">
        <div className="flex items-center gap-4">
          <Image src="/Logo-Estambul.jpg" alt="Logo Estambul" width={64} height={64}
                 className="rounded-full border border-red-200" />
          <h1 className="text-3xl font-bold text-red-700">Panel ADMIN</h1>
        </div>
        <button onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg border border-gray-300 shadow">
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 w-full max-w-6xl justify-end">
        <button onClick={() => handleSendReport("excel")} disabled={loading}
                className="bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 text-green-700 font-semibold px-4 py-2 rounded-lg border border-green-300 shadow">
          Enviar Excel
        </button>
        <button onClick={() => handleSendReport("pdf")} disabled={loading}
                className="bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 font-semibold px-4 py-2 rounded-lg border border-blue-300 shadow">
          Enviar PDF
        </button>
      </div>

      <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg border border-red-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-red-700">Resumen Mensual:</h2>
          <select value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="border border-red-200 rounded px-2 py-1 text-sm">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando datos...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50 text-red-700">
                <th className="p-2">Nro Repartidor</th>
                <th className="p-2">Turnos</th>
                <th className="p-2">Horas</th>
                <th className="p-2">Tickets</th>
                <th className="p-2">Cobro</th>
                <th className="p-2">Incidencias</th>
                <th className="p-2">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row, idx) => (
                <tr key={idx} className="border-b border-red-100 hover:bg-red-50">
                  <td className="p-2 text-center font-bold text-blue-700">{row.driverId}</td>
                  <td className="p-2 text-center">{row.turnos}</td>
                  <td className="p-2 text-center">{row.horas.toFixed(1)}h</td>
                  <td className="p-2 text-center">{row.tickets}</td>
                  <td className="p-2 text-center text-green-700">€{row.cobro.toFixed(2)}</td>
                  <td className="p-2 text-xs">{row.incidencias.map(i => `${i.fecha}: ${i.texto}`).join(" | ")}</td>
                  <td className="p-2 text-xs">{row.observaciones.map(o => `${o.fecha}: ${o.texto}`).join(" | ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

