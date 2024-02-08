const { Pool } = require('pg')



const connection = {
    connect: async function (username, password, host) {
        const pool = new Pool({
            user: username,
            password: password,
            host: host,
            port: 5432,
            database: 'estbike'
        })

        return pool
    },
    runQuery: async function (pool, query) {
        const client = await pool.connect()
        try {
            const res = await client.query(query)
            return res
        } catch (error) {
            console.log(error)
        }
    }
}


module.exports = connection