// Script Node.js para cerrar todas las sesiones activas en Supabase
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function closeAllSessions() {
	const now = new Date().toISOString()
	const { error } = await supabase
		.from('sessions')
		.update({ is_active: false })
		.eq('is_active', true)
		.lt('expires_at', now)
	if (error) {
		console.error('Error cerrando sesiones expiradas:', error)
		process.exit(1)
	}
	console.log('Todas las sesiones expiradas han sido cerradas.')
	process.exit(0)
}

closeAllSessions()
