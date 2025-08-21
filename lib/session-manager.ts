import { supabase } from "./supabase-client"

export interface Session {
	id: string
	user_id: string
	role: string
	token: string
	created_at: string
	expires_at?: string
	is_active: boolean
}

export class SessionManager {
	/**
	 * Cierra todas las sesiones activas (admin tool)
	 */
	static async closeAllSessions(): Promise<void> {
		await supabase.from("sessions").update({ is_active: false }).eq("is_active", true)
	}
	/**
	 * Crea o actualiza la sesión única para el usuario
	 */
	static async createOrUpdateSession(userId: string, role: string): Promise<string | null> {
		const token = `${userId}_${role}_${Date.now()}_${Math.random().toString(36).slice(2)}`
		const expiresAt = new Date(Date.now() + 60 * 1000).toISOString() // Expira en 1 minuto
		// Cierra cualquier sesión activa previa del mismo usuario y rol
		await supabase.from("sessions").update({ is_active: false }).eq("user_id", userId).eq("role", role).eq("is_active", true)
		// Crea nueva sesión
		const { data, error } = await supabase.from("sessions").insert({
			user_id: userId,
			role,
			token,
			is_active: true,
			expires_at: expiresAt,
		}).select().single()
		if (error) return null
		return data.token
	}

	/**
	 * Valida si la sesión es activa y única
	 */
	static async validateSession(userId: string, token: string): Promise<boolean> {
		const { data, error } = await supabase
			.from("sessions")
			.select("is_active, token, expires_at")
			.eq("user_id", userId)
			.eq("token", token)
			.single()
		if (error || !data) return false
		const now = new Date()
		const expires = data.expires_at ? new Date(data.expires_at) : null
		const notExpired = expires ? now < expires : true
		return data.is_active && data.token === token && notExpired
	}

	/**
	 * Cierra la sesión del usuario
	 */
	static async closeSession(userId: string): Promise<void> {
		await supabase.from("sessions").update({ is_active: false }).eq("user_id", userId)
	}
}
