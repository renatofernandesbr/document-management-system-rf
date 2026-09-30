const fs = require('node:fs');
const path = require('node:path');

function createDocumentRepository({ storageDir }) {
  const resolvedStorageDir = path.resolve(storageDir);
  fs.mkdirSync(resolvedStorageDir, { recursive: true });
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
      if (
        typeof storedName !== 'string' ||
        !storedName ||
        path.isAbsolute(storedName) ||
        storedName.includes('/') ||
        storedName.includes('\\')
      ) {
        throw new Error('Nome físico de arquivo inválido.');
      }

      const filePath = path.resolve(resolvedStorageDir, storedName);
      const relativePath = path.relative(resolvedStorageDir, filePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('Caminho de arquivo fora do armazenamento.');
      }

      try {
        if (fs.lstatSync(filePath).isSymbolicLink()) {
          throw new Error('Links simbólicos não são permitidos no armazenamento.');
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      return filePath;
    },

    removeFile(storedName) {
      const filePath = this.getFilePath(storedName);
      fs.rmSync(filePath, { force: true });
    }
  };
}

module.exports = { createDocumentRepository };