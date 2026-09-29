const { AppError } = require('../errors/appError');

function requireUser(req, res, next) {
  // Normaliza a identidade antes de usá-la para restringir o acesso aos documentos.
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return next(new AppError(400, 'USER_REQUIRED', 'O cabeçalho X-User-Id é obrigatório.'));
  }

  req.owner = owner;
  return next();
}

module.exports = { requireUser };