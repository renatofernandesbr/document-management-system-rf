const { randomUUID } = require('node:crypto');
const { AppError } = require('../errors/appError');

function getOriginalName(fileName) {
  return fileName.replace(/\\/g, '/').split('/').pop();
}

function buildDocument({ file, owner }) {
  return {
    id: randomUUID(),
    originalName: getOriginalName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename
  };
}

function toPublicDocument({ storedName, ...document }) {
  return document;
}

function ensureOwner(document, owner) {
  if (!document || document.owner !== owner) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }
}

function createDocumentService(repository) {
  return {
    create({ file, owner }) {
      if (!file) {
        throw new AppError(400, 'FILE_REQUIRED', 'É necessário enviar um arquivo.');
      }

      const document = buildDocument({ file, owner });
      repository.create(document);
      return toPublicDocument(document);
    },

    list(owner) {
      return repository.findByOwner(owner).map(toPublicDocument);
    },

    getDownload(id, owner) {
      const document = repository.findById(id);
      ensureOwner(document, owner);
      return document;
    }
  };
}

module.exports = { createDocumentService };