const { Sequelize } = require('sequelize');

const serviceName = process.env.SERVICE_NAME || 'default';

const cluster = require('cluster');
const workers = cluster.isWorker ? parseInt(process.env.USER_SERVICE_WORKERS || process.env.STREAMING_SERVICE_WORKERS || '2') : 1;

const poolConfig = {
  'user-service':         { max: Math.ceil(12 / workers), min: 1 },
  'admin-service':        { max: 8,  min: 1 },
  'payment-service':      { max: 8,  min: 2 },
  'streaming-service':    { max: Math.ceil(10 / workers), min: 1 },
  'notification-service': { max: 5,  min: 1 },
  'default':              { max: 8,  min: 2 },
};

const pool = poolConfig[serviceName] || poolConfig['default'];

const dbHost     = process.env.DB_WRITE_HOST;
const dbReadHost = process.env.DB_READ_HOST || process.env.DB_WRITE_HOST;
const dbUser     = process.env.DB_USER  || 'dramamix_admin';
const dbPass     = process.env.DB_PASSWORD || process.env.TF_DB_PASSWORD;
const dbName     = process.env.DB_NAME  || 'dramamix';
const dbPort     = parseInt(process.env.DB_PORT || '5432');

if (!dbHost || !dbPass) {
  console.error('[DB] FATAL: DB_WRITE_HOST and DB_PASSWORD (or TF_DB_PASSWORD) must be set');
  process.exit(1);
}

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
});

const sequelizeRead = new Sequelize(dbName, dbUser, dbPass, {
  ...sharedOptions,
  host: dbReadHost,
  pool: {
    max: pool.max * 2,
    min: pool.min,
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
});

module.exports = { sequelizeWrite, sequelizeRead };
