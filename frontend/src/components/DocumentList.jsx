import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
}

export default function DocumentList({ documents, loading, owner }) {
  if (loading) {
    return <p className="list-state" role="status">Carregando documentos…</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento por aqui.</p>
        <span>Os arquivos enviados aparecerão nesta lista.</span>
      </div>
    );
  }

  return (
    <div className="document-list" role="list">
      {documents.map((item) => (
        <article className="document-row" key={item.id} role="listitem">
          <span className="document-mark" aria-hidden="true">DOC</span>
          <div className="document-info">
            <h3 title={item.originalName}>{item.originalName}</h3>
            <p>{formatDate(item.uploadedAt)} <span aria-hidden="true">·</span> {formatSize(item.size)}</p>
          </div>
          <DownloadButton owner={owner} documentId={item.id} />
        </article>
      ))}
    </div>
  );
}