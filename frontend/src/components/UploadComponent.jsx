import { useState } from 'react';
import { uploadDocument } from '../services/documents.js';
import useAsyncAction from '../hooks/useAsyncAction.js';

export default function UploadComponent({ owner, onUploaded }) {
  const [message, setMessage] = useState('');
  const { run, busy, error, setError } = useAsyncAction(uploadDocument);

  async function submitUpload(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get('file');
    setMessage('');
    if (!(file instanceof File) || (file.size === 0 && !file.name)) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    const uploadedDocument = await run(owner, file);
    if (!uploadedDocument) return;

    onUploaded(uploadedDocument);
    form.reset();
    setMessage('Arquivo enviado com sucesso.');
  }

  return (
    <form className="upload-form" onSubmit={submitUpload}>
      <label className="file-control" htmlFor="document-file">
        <span className="file-mark" aria-hidden="true">＋</span>
        <span className="file-copy">
          <strong>Escolher documento</strong>
          <span>Qualquer formato, até 10 MB</span>
        </span>
        <input id="document-file" name="file" type="file" required />
      </label>
      <button className="primary-button" type="submit" disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar arquivo'}
      </button>
      {error && <p className="upload-feedback error-text" role="alert">{error}</p>}
      {message && <p className="upload-feedback success-text" role="status">{message}</p>}
    </form>
  );
}