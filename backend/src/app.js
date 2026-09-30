const express = require('express');
const path = require('node:path');
const { createDocumentRepository } = require('./repositories/documentRepository');
const { createDocumentService } = require('./services/documentService');
const { createDocumentRoutes } = require('./routes/documentRoutes');
const { errorHandler } = require('./middleware/errorHandler');

// Permite configurar cada instância, mantendo os testes isolados do servidor real.
function createApp(options = {}) {
  const storageDir = path.resolve(
    options.storageDir || process.env.STORAGE_DIR || path.join(__dirname, '../storage')
  );
  const configuredMaxFileSize = options.maxFileSize ?? process.env.MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024;
  const maxFileSize = Number(configuredMaxFileSize);
  if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }
  const repository = createDocumentRepository({ storageDir });
  const service = createDocumentService(repository);
  const app = express();

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocumentRoutes({ service, repository, storageDir, maxFileSize }));
  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } });
  });
  app.use(errorHandler);

  return app;
}

const app = createApp();
app.createApp = createApp;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
