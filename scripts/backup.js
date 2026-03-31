const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function backup() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_CA ? { ca: Buffer.from(process.env.DB_CA, 'base64').toString() } : null
    };

    let connection;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    try {
        console.log(`🚀 Starting database backup for ${config.database}...`);
        connection = await mysql.createConnection(config);

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        let sqlDump = `-- Database Backup\n-- Generated on ${new Date().toISOString()}\n\n`;
        sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

        for (const table of tableNames) {
            console.log(`📦 Dumping table: ${table}`);
            
            // Get Create Table status
            const [[createTable]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
            sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
            sqlDump += `${createTable['Create Table']};\n\n`;

            // Get Data
            const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
            if (rows.length > 0) {
                const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
                sqlDump += `INSERT INTO \`${table}\` (${columns}) VALUES\n`;
                
                const values = rows.map(row => {
                    return '(' + Object.values(row).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
                        return val;
                    }).join(', ') + ')';
                }).join(',\n') + ';\n\n';
                
                sqlDump += values;
            }
        }

        sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

        fs.writeFileSync(backupFile, sqlDump);
        console.log(`✅ Backup completed successfully: ${backupFile}`);

    } catch (error) {
        console.error('❌ Backup failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

backup();
