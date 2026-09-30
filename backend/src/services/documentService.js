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
  function sanitizeOriginalName(originalName) {
    const name = String(originalName || '')
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 255);

    return name || 'documento';
  }

  return {
    create({ file, owner }) {
      if (!file) {
        throw new AppError(400, 'FILE_REQUIRED', 'É necessário enviar um arquivo.');
      }

      const originalName = sanitizeOriginalName(file.originalname);
      const document = {
        id: randomUUID(),
        originalName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storedName: file.filename
      };

      try {
        repository.create(document);
      } catch (error) {
        repository.removeFile(document.storedName);
        throw error;
      }
      return toPublicDocument(document);
    },

    list(owner) {
      return repository.findByOwner(owner).map(toPublicDocument);
    },

    getDownload(id, owner) {
      const document = repository.findById(id);
      if (!document || document.owner !== owner) {
        // Retorna o mesmo erro nos dois casos para não revelar documentos de outros usuários.
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
      }

      return {
        filePath: repository.getFilePath(document.storedName),
        originalName: document.originalName
      };
    }
  };
}

module.exports = { createDocumentService };