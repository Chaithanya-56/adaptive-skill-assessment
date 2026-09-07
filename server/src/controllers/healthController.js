const { checkDatabaseConnection } = require('../config/db');

async function getHealth(req, res) {
  try {
    await checkDatabaseConnection();

    return res.status(200).json({
      success: true,
      message: 'Server and database are healthy',
      data: {
        server: 'UP',
        database: 'UP'
      }
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Server is running but database connection failed',
      data: {
        server: 'UP',
        database: 'DOWN'
      },
      error: error.message
    });
  }
}

module.exports = {
  getHealth
};
