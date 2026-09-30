const { AppError } = require('../errors/appError');

function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner || owner.length > 128 || /[\r\n]/.test(owner)) {
    return next(new AppError(400, 'USER_REQUIRED', 'O cabeçalho X-User-Id é obrigatório.'));
  }

  req.owner = owner;
  return next();
}

module.exports = { requireUser };