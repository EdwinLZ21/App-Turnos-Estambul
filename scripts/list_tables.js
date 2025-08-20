const { Client } = require('pg')
// const dns = require('dns')

const connectionString = process.env.POSTGRES_CONNECTION_STRING

if (!connectionString) {
	console.error('POSTGRES_CONNECTION_STRING no está definido en el entorno.')
	process.exit(1)
}

async function main() {
	const client = new Client({
		connectionString,
		ssl: { rejectUnauthorized: false },
		// If IPv6 connectivity is not available, consider forcing IPv4 lookup.
		// lookup: (hostname, opts, cb) => dns.lookup(hostname, { family: 4, all: false }, cb),
	})
	await client.connect()
	const sql = `
		SELECT table_schema, table_name
		FROM information_schema.tables
		WHERE table_type = 'BASE TABLE'
			AND table_schema NOT IN ('pg_catalog','information_schema','pg_toast')
		ORDER BY table_schema, table_name
	`
	const res = await client.query(sql)
	console.log(JSON.stringify(res.rows, null, 2))
	await client.end()
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})


