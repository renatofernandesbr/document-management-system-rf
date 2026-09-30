const { AppError } = require('../errors/appError');

function requireUser(req, res, next) {
  // Este cabeçalho identifica o usuário lógico, mas não substitui autenticação.
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return next(new AppError(400, 'USER_REQUIRED', 'O cabeçalho X-User-Id é obrigatório.'));
  }
  if (owner.length > 128 || /[\u0000-\u001f\u007f]/.test(owner)) {
    return next(new AppError(400, 'INVALID_USER', 'O identificador de usuário é inválido.'));
  }

  req.owner = owner;
  return next();
}

module.exports = { requireUser };