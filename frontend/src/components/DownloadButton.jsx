import { useState } from 'react';
import { downloadDocument } from '../services/documents.js';

export default function DownloadButton({ owner, documentId }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    setBusy(true);
    setError('');
    try {
      await downloadDocument(owner, documentId);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="download-action">
      <button className="download-button" type="button" onClick={download} disabled={busy}>
        {busy ? 'Preparando…' : 'Baixar'}
      </button>
      {error && <span className="download-error" role="alert">{error}</span>}
    </span>
  );
}