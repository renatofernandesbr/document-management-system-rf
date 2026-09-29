// Carrega status e código HTTP para o middleware padronizar erros esperados da aplicação.
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = { AppError };