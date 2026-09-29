const multer = require('multer');
const { AppError } = require('../errors/appError');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: tooLarge
          ? 'O arquivo excede o tamanho máximo permitido.'
          : 'A requisição de upload é inválida.'
      }
    });
  }

  const status = error instanceof AppError ? error.status : 500;
  const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';
  const message = error instanceof AppError ? error.message : 'Ocorreu um erro interno.';

  if (status === 500) {
    console.error(error);
  }

  return res.status(status).json({ error: { code, message } });
}

module.exports = { errorHandler };