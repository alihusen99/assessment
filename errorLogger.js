const fs = require('fs');

const errorLogger = (err, req, res, next) => {
  console.log('Error Logger Middleware Called'); // Tambahkan log ini

  // Tangkap pesan kesalahan
  const errorLog = `${new Date().toISOString()} - ${err.stack}\n`;

  // Tulis pesan kesalahan ke file log (error.log)
  fs.appendFile('error.log', errorLog, (error) => {
    if (error) {
      console.error('Error writing to error.log:', error);
    }
  });

  // Lanjutkan ke middleware error handling Express bawaan
  next(err);
};

module.exports = errorLogger;
