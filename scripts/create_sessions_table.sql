-- Tabla para gestionar sesiones únicas por usuario
CREATE TABLE IF NOT EXISTS sessions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id TEXT NOT NULL,
	role TEXT NOT NULL,
	token TEXT NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
	expires_at TIMESTAMP WITH TIME ZONE,
	is_active BOOLEAN DEFAULT TRUE,
	UNIQUE(user_id)
);
-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
