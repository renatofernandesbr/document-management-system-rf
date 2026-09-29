const fs = require('node:fs');
const path = require('node:path');

function createDocumentRepository({ storageDir }) {
  fs.mkdirSync(storageDir, { recursive: true });
  // Nesta versão, apenas os metadados ficam em memória; os arquivos usam o diretório local.
  const documents = new Map();

  return {
    create(document) {
      documents.set(document.id, document);
      return document;
    },

    findById(id) {
      return documents.get(id) || null;
    },

    findByOwner(owner) {
      return Array.from(documents.values())
        .filter((document) => document.owner === owner)
        .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
    },

    getFilePath(storedName) {
      return path.join(storageDir, storedName);
    }
  };
}

module.exports = { createDocumentRepository };