const { Sequelize } = require('sequelize');

const serviceName = process.env.SERVICE_NAME || 'default';

const cluster = require('cluster');
const workers = cluster.isWorker
  ? parseInt(process.env.USER_SERVICE_WORKERS || process.env.STREAMING_SERVICE_WORKERS || '2')
  : 1;

const poolConfig = {
  'user-service':         { max: Math.ceil(12 / workers), min: 1 },
  'admin-service':        { max: 8,  min: 1 },
  'payment-service':      { max: 8,  min: 2 },
  'streaming-service':    { max: Math.ceil(10 / workers), min: 1 },
  'notification-service': { max: 5,  min: 1 },
  'default':              { max: 8,  min: 2 },
};

const pool = poolConfig[serviceName] || poolConfig['default'];

function parseDbUrl(url) {
  try {
    const u = new URL(url);
    return {
      host:     u.hostname,
      port:     parseInt(u.port || '5432'),
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  } catch (e) {
    return null;
  }
}

const writeUrl  = process.env.NEON_DATABASE_URL || process.env.DB_WRITER_URL;
const readUrl   = process.env.DB_READ_URL       || process.env.DB_READER_URL;

const writeParsed = writeUrl ? parseDbUrl(writeUrl) : null;
const readParsed  = readUrl  ? parseDbUrl(readUrl)  : null;

const dbHost     = writeParsed?.host     || process.env.DB_WRITE_HOST;
const dbReadHost = readParsed?.host      || process.env.DB_READ_HOST || dbHost;
const dbUser     = writeParsed?.username || process.env.DB_USER      || 'dramamix_admin';
const dbPass     = writeParsed?.password || process.env.DB_PASSWORD  || process.env.TF_DB_PASSWORD;
const dbName     = writeParsed?.database || process.env.DB_NAME      || 'dramamix';
const dbPort     = writeParsed?.port     || parseInt(process.env.DB_PORT || '5432');

if (!dbHost || !dbPass) {
  console.error('[DB] FATAL: No database connection config found. Set NEON_DATABASE_URL or DB_WRITE_HOST + DB_PASSWORD.');
  process.exit(1);
}

const isReadSeparate = dbReadHost !== dbHost;
console.log(`[DB] Writer: ${dbHost} | Reader: ${dbReadHost} | Read-split: ${isReadSeparate}`);

const sharedOptions = {
  dialect: 'postgres',
  username: dbUser,
  password: dbPass,
  database: dbName,
  port: dbPort,
  logging: false,
  pool: {
    max: pool.max,
    min: pool.min,
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 60000,
    application_name: `dramamix-${serviceName}`,
  },
  retry: { max: 3 },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

const sequelizeWrite = new Sequelize(dbName, dbUser, dbPass, {
  ...sharedOptions,
  host: dbHost,
  port: dbPort,
});

const readPass = readParsed?.password || dbPass;
const readUser = readParsed?.username || dbUser;

const sequelizeRead = new Sequelize(dbName, readUser, readPass, {
  ...sharedOptions,
  host: dbReadHost,
  port: readParsed?.port || dbPort,
  password: readPass,
  username: readUser,
  pool: {
    max: pool.max * 2,
    min: pool.min,
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
});

module.exports = { sequelizeWrite, sequelizeRead, sequelize: sequelizeWrite };
