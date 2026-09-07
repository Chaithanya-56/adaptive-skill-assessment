require('dotenv').config();

const app = require('./app');
const { checkDatabaseConnection, pool } = require('./config/db');

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await checkDatabaseConnection();
    console.log('MySQL connection established.');
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log('Shutting down server...');
    await pool.end();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
