const { randomUUID } = require('node:crypto');
const { AppError } = require('../errors/appError');

function createDocumentService(repository) {
  return {
    create({ file, owner }) {
      if (!file) {
        throw new AppError(400, 'FILE_REQUIRED', 'É necessário enviar um arquivo.');
      }

      // Descarta diretórios que possam vir no nome e preserva apenas o nome exibível.
      const originalName = file.originalname.replace(/\\/g, '/').split('/').pop();
      const document = {
        id: randomUUID(),
        originalName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storedName: file.filename
      };

      repository.create(document);
      return document;
    },

    list(owner) {
      return repository.findByOwner(owner);
    },

    getDownload(id, owner) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) {
        // Retorna o mesmo erro nos dois casos para não revelar documentos de outros usuários.
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return document;
    }
  };
}

module.exports = { createDocumentService };