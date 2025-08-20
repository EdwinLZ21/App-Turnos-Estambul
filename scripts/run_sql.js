const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const connectionString = process.env.POSTGRES_CONNECTION_STRING
if (!connectionString) {
	console.error('POSTGRES_CONNECTION_STRING no está definido')
	process.exit(1)
}

async function run() {
	const file = process.argv[2]
	if (!file) {
		console.error('Uso: node scripts/run_sql.js <ruta_sql>')
		process.exit(1)
	}
	const sql = fs.readFileSync(path.resolve(file), 'utf8')
	const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
	await client.connect()
	await client.query('begin')
	try {
		await client.query(sql)
		await client.query('commit')
		console.log('OK')
	} catch (e) {
		await client.query('rollback')
		console.error(e)
		process.exit(1)
	} finally {
		await client.end()
	}
}

run()


