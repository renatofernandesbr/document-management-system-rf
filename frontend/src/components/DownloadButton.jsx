import { downloadDocument } from '../services/documents.js';
import useAsyncAction from '../hooks/useAsyncAction.js';

export default function DownloadButton({ owner, documentId }) {
  const { run, busy, error } = useAsyncAction(downloadDocument);

  function download() {
    run(owner, documentId);
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