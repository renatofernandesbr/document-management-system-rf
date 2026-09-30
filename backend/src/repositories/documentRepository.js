const fs = require('node:fs');
const path = require('node:path');

function createDocumentRepository({ storageDir }) {
  fs.mkdirSync(storageDir, { recursive: true });
  const resolvedStorageDir = path.resolve(storageDir);
  // Nesta versão, apenas os metadados ficam em memória; os arquivos usam o diretório local.
  const documents = new Map();

  function getFilePath(storedName) {
    if (!/^[0-9a-f-]{36}$/i.test(storedName)) {
      throw new Error('Nome interno de arquivo inválido.');
    }

    const filePath = path.resolve(resolvedStorageDir, storedName);
    const relativePath = path.relative(resolvedStorageDir, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Caminho de arquivo inválido.');
    }
    return filePath;
  }

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

    getFilePath,

    removeFile(storedName) {
      return fs.promises.unlink(getFilePath(storedName)).catch((error) => {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      });
    }
  };
}

module.exports = { createDocumentRepository };