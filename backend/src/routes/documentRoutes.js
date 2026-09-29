const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const { createDocumentController } = require('../controllers/documentController');
const { requireUser } = require('../middleware/requireUser');

function createDocumentRoutes({ service, repository, storageDir, maxFileSize }) {
  const router = express.Router();
  const controller = createDocumentController({ service, repository });
  const upload = multer({
    storage: multer.diskStorage({
      destination: storageDir,
      // Evita colisões e não usa o nome fornecido pelo cliente como caminho no disco.
      filename: (req, file, callback) => callback(null, crypto.randomUUID())
    }),
    limits: { fileSize: maxFileSize }
  });

  router.post('/upload', requireUser, upload.single('file'), controller.upload);
  router.get('/documents', requireUser, controller.list);
  router.get('/documents/:id/download', requireUser, controller.download);

  return router;
}

module.exports = { createDocumentRoutes };