function createDocumentController({ service, repository }) {
  return {
    upload(req, res) {
      const document = service.create({ file: req.file, owner: req.owner });
      const { storedName, ...publicDocument } = document;
      return res.status(201).json(publicDocument);
    },

    list(req, res) {
      const documents = service.list(req.owner).map(({ storedName, ...document }) => document);
      return res.json({ documents });
    },

    download(req, res, next) {
      const document = service.getDownload(req.params.id, req.owner);
      return res.download(
        repository.getFilePath(document.storedName),
        document.originalName,
        (error) => {
          if (!error || res.headersSent) {
            return;
          }
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