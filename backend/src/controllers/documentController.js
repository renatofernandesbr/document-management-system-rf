const { AppError } = require('../errors/appError');

function createDocumentController({ service }) {
  return {
    upload(req, res) {
      const document = service.create({ file: req.file, owner: req.owner });
      return res.status(201).json(document);
    },

    list(req, res) {
      return res.json({ documents: service.list(req.owner) });
    },

    download(req, res, next) {
      const document = service.getDownload(req.params.id, req.owner);
      return res.download(
        document.filePath,
        document.originalName,
        (error) => {
          if (!error || res.headersSent) {
            return;
          }
          // Os metadados podem continuar em memória mesmo se o arquivo tiver sido removido.
          if (error.code === 'ENOENT') {
            return next(new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.'));
          }
          return next(error);
        }
      );
    }
  };
}

module.exports = { createDocumentController };