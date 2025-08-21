"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { useState, useEffect } from "react"

export default function AdminDashboard() {
/**
 * Limpia todos los registros de la base de datos local (localStorage)
 * Borra todos los datos de turnos y caja, incluyendo los registros individuales de cada repartidor.
 */
const handleCleanLocalDB = () => {
	if (!confirm("¿Seguro que deseas borrar TODOS los registros de turnos y caja? Esta acción no se puede deshacer.")) return;
	localStorage.removeItem("driverShifts");
	localStorage.removeItem("pendingShifts");
	localStorage.removeItem("reviewedShifts");
	// Limpiar datos individuales de cada repartidor (asumiendo IDs del 1 al 12)
	for (let i = 1; i <= 12; i++) {
		localStorage.removeItem(`currentShift_${i}`);
		localStorage.removeItem(`currentShiftDraft_${i}`);
		localStorage.removeItem(`shiftSubmitted_${i}`);
		localStorage.removeItem(`previousShift_${i}`);
	}
	alert("Todos los registros han sido eliminados correctamente.");
	setMonths([]);
	setMonthlyData([]);
	setSelectedMonth("");
};
			// Estado principal del panel de administración
			const [selectedMonth, setSelectedMonth] = useState<string>("");
			const [months, setMonths] = useState<string[]>([]);
			const [monthlyData, setMonthlyData] = useState<any[]>([]);

			   useEffect(() => {
				   // Obtener meses disponibles desde localStorage (driverShifts)
				   const driverShiftsRaw = localStorage.getItem("driverShifts") || "{}";
				   const driverShifts = JSON.parse(driverShiftsRaw);
				   const allShifts: any[] = Object.values(driverShifts).flat();
				   const uniqueMonths = Array.from(new Set(allShifts.map((row: any) => {
					   const d = new Date(row.date);
					   return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
				   }))).sort((a, b) => b.localeCompare(a));
				   setMonths(uniqueMonths as string[]);
				   if (!selectedMonth && uniqueMonths.length > 0) setSelectedMonth(String(uniqueMonths[0]));
			   }, []);

			   useEffect(() => {
				   if (!selectedMonth) return;
				   // Obtener datos mensuales desde localStorage (driverShifts)
				   const driverShiftsRaw = localStorage.getItem("driverShifts") || "{}";
				   const driverShifts = JSON.parse(driverShiftsRaw);
				   const allShifts: any[] = Object.entries(driverShifts).flatMap(([driverId, shifts]) => {
					   if (Array.isArray(shifts)) {
						   return shifts.map(shift => ({ ...shift, driverId }));
					   }
					   return [];
				   });
				   const filtered = allShifts.filter((row: any) => {
					   const d = new Date(row.date);
					   const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
					   return m === selectedMonth;
				   });
				   // Agrupar y calcular resumen mensual
				   const grouped: { [id: string]: any } = {};
				   filtered.forEach((row: any) => {
					   if (!grouped[row.driverId]) {
						   grouped[row.driverId] = {
							   driverId: row.driverId,
							   turnos: 0,
							   horas: 0,
							   tickets: 0,
							   cobro: 0,
							   incidencias: [],
							   observaciones: [],
						   };
					   }
					   grouped[row.driverId].turnos++;
					   grouped[row.driverId].horas += Number(row.hoursWorked || row.hours_worked || 0);
					   grouped[row.driverId].tickets += Number(row.totalTickets || row.tickets_delivered || 0);
					   grouped[row.driverId].cobro += Number(row.totalEarned || 0);
					   if (row.incidents) grouped[row.driverId].incidencias.push({ fecha: row.date, texto: row.incidents });
					   if (row.review_notes) grouped[row.driverId].observaciones.push({ fecha: row.date, texto: row.review_notes });
				   });
				   Object.values(grouped).forEach((g: any) => {
					   g.cobro = `$${g.cobro.toLocaleString()}`;
				   });
				   setMonthlyData(Object.values(grouped));
			   }, [selectedMonth]);

	const router = useRouter();

	// --- Panel ADMIN ---

	/**
	 * Exporta el resumen mensual a un archivo Excel (CSV)
	 * Incluye todos los datos filtrados por mes seleccionado.
	 */
	const handleExportExcel = () => {
		// Exportar datos a Excel (simulado)
		let csv = "Nro Repartidor,Turnos,Horas,Tickets,Cobro,Incidencias,Observaciones\n";
			monthlyData.forEach(row => {
					csv += `${row.driverId},${row.turnos},${row.horas},${row.tickets},"${row.cobro}",`;
					csv += `"${row.incidencias.filter((i: any) => {
						const d = new Date(i.fecha);
						const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
						return m === selectedMonth;
					}).map((i: any) => i.fecha + ': ' + i.texto).join(' | ')}",`;
					csv += `"${row.observaciones.filter((o: any) => {
						const d = new Date(o.fecha);
						const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
						return m === selectedMonth;
					}).map((o: any) => o.fecha + ': ' + o.texto).join(' | ')}"\n`;
			});
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `reporte-mensual-${selectedMonth}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	/**
	 * Exporta el resumen mensual a un archivo PDF
	 * Utiliza jsPDF y autoTable para generar el reporte mensual.
	 */
	const handleExportPDF = () => {
				const doc = new jsPDF();
				doc.setFontSize(16);
				doc.text(`Resumen Mensual: ${selectedMonth}`, 14, 18);
				doc.setFontSize(10);

				// Definir columnas
				const columns = [
					{ header: "Nro Repartidor", dataKey: "driverId" },
					{ header: "Turnos", dataKey: "turnos" },
					{ header: "Horas", dataKey: "horas" },
					{ header: "Tickets", dataKey: "tickets" },
					{ header: "Cobro", dataKey: "cobro" },
					{ header: "Incidencias", dataKey: "incidencias" },
					{ header: "Observaciones", dataKey: "observaciones" },
				];

					// Preparar filas con tipado explícito
					type RowType = {
						driverId: string
						turnos: number
						horas: number
						tickets: number
						cobro: string
						incidencias: string
						observaciones: string
					}
					const rows: RowType[] = monthlyData.map(row => {
						const incidencias = row.incidencias.filter((i: any) => {
							const d = new Date(i.fecha);
							const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
							return m === selectedMonth;
						}).map((i: any) => i.fecha + ': ' + i.texto).join(' | ');
						const observaciones = row.observaciones.filter((o: any) => {
							const d = new Date(o.fecha);
							const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
							return m === selectedMonth;
						}).map((o: any) => o.fecha + ': ' + o.texto).join(' | ');
						return {
							driverId: String(row.driverId),
							turnos: Number(row.turnos),
							horas: Number(row.horas),
							tickets: Number(row.tickets),
							cobro: String(row.cobro),
							incidencias,
							observaciones,
						};
					});

						// Usar autoTable para formato de cuadrícula
						autoTable(doc, {
							startY: 28,
							head: [columns.map(col => col.header)],
							body: rows.map(row => [
								row.driverId,
								row.turnos,
								row.horas,
								row.tickets,
								row.cobro,
								row.incidencias,
								row.observaciones
							]),
							theme: 'grid',
							styles: { cellPadding: 2, fontSize: 9 },
							headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
							alternateRowStyles: { fillColor: [255, 237, 213] },
							margin: { left: 10, right: 10 },
						});

				doc.save(`reporte-mensual-${selectedMonth}.pdf`);
	};

	/**
	 * Cierra sesión y limpia datos residuales del usuario y repartidores.
	 * Redirige al login.
	 */
	const handleLogout = () => {
			localStorage.removeItem("userRole")
			localStorage.removeItem("userId")
			// Limpiar posibles datos residuales
			for (let i = 1; i <= 12; i++) {
				localStorage.removeItem(`currentShift_${i}`)
				localStorage.removeItem(`currentShiftDraft_${i}`)
				localStorage.removeItem(`shiftSubmitted_${i}`)
				localStorage.removeItem(`previousShift_${i}`)
			}
			router.push("/login")
	};

	return (
		<div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-red-50 to-white p-8">
			<div className="flex items-center gap-4 mb-8 w-full max-w-5xl justify-between">
				<div className="flex items-center gap-4">
					<Image src="/Logo-Estambul.jpg" alt="Logo Estambul" width={64} height={64} className="rounded-full border border-red-200" />
					<h1 className="text-3xl font-bold text-red-700">Panel ADMIN</h1>
				</div>
				<button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg border border-gray-300 shadow transition-all duration-150">Cerrar sesión</button>
			</div>
			{/* Botones de acciones */}
			<div className="flex flex-wrap gap-4 mb-6 w-full max-w-5xl justify-end">
				<button onClick={handleCleanLocalDB} className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold px-4 py-2 rounded-lg border border-orange-300 shadow transition-all duration-150">Limpiar todos los registros</button>
				<button onClick={handleExportExcel} className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-4 py-2 rounded-lg border border-green-300 shadow transition-all duration-150">Exportar a Excel</button>
				<button onClick={handleExportPDF} className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-lg border border-blue-300 shadow transition-all duration-150">Exportar a PDF</button>
			</div>
					<div className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-red-200 p-6">
						<div className="flex items-center gap-4 mb-4">
							<h2 className="text-xl font-bold text-red-700">Resumen Mensual:</h2>
							<select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border border-red-200 rounded px-2 py-1 text-sm">
								{months.map(m => (
									<option key={m} value={m}>{m}</option>
								))}
							</select>
						</div>
						<table className="w-full text-sm">
					<thead>
						<tr className="bg-red-50 text-red-700">
							<th className="p-2 font-semibold">Nro Repartidor</th>
							<th className="p-2 font-semibold">Turnos</th>
							<th className="p-2 font-semibold">Horas Trabajadas</th>
							<th className="p-2 font-semibold">Tickets</th>
							<th className="p-2 font-semibold">Cobro</th>
							<th className="p-2 font-semibold">Incidencias</th>
							<th className="p-2 font-semibold">Observaciones</th>
						</tr>
					</thead>
					<tbody>
						{monthlyData.map((row, idx) => (
											<tr key={idx} className="border-b border-red-100 hover:bg-red-50">
												<td className="p-2 text-center font-bold text-blue-700">{row.driverId}</td>
												<td className="p-2 text-center">{row.turnos}</td>
												<td className="p-2 text-center">{row.horas}h</td>
												<td className="p-2 text-center">{row.tickets}</td>
												<td className="p-2 text-center font-semibold text-green-700">{row.cobro}</td>
												<td className="p-2 text-xs text-gray-700">
													{row.incidencias.map((i: any) => `${i.fecha}: ${i.texto}`).join(" | ")}
												</td>
												<td className="p-2 text-xs text-gray-700">
													{row.observaciones.map((o: any) => `${o.fecha}: ${o.texto}`).join(" | ")}
												</td>
											</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
