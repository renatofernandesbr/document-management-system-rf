import { useEffect, useState } from 'react';
import { getDocuments } from './services/documents.js';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import './app.css';

function storedOwner() {
  return window.localStorage.getItem('dms-user-id') || 'demo-user';
}

export default function App() {
  const [owner, setOwner] = useState(storedOwner);
  const [ownerInput, setOwnerInput] = useState(storedOwner);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    getDocuments(owner, controller.signal)
      .then(setDocuments)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [owner]);

  function changeOwner(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();
    if (!nextOwner) {
      setError('Informe um identificador de usuário.');
      return;
    }

    window.localStorage.setItem('dms-user-id', nextOwner);
    setOwner(nextOwner);
  }

  async function refreshDocuments() {
    setRefreshing(true);
    setError('');
    try {
      setDocuments(await getDocuments(owner));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRefreshing(false);
    }
  }

  function addDocument(document) {
    setDocuments((currentDocuments) =>
      [document, ...currentDocuments].sort(
        (left, right) => right.uploadedAt.localeCompare(left.uploadedAt)
      )
    );
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="Arquivo, início">
          <span className="wordmark-mark" aria-hidden="true">A</span>
          <span>Arquivo</span>
        </a>
        <form className="identity-form" onSubmit={changeOwner}>
          <label htmlFor="owner-id">Usuário</label>
          <input
            id="owner-id"
            value={ownerInput}
            onChange={(event) => setOwnerInput(event.target.value)}
            aria-label="Identificador do usuário"
          />
          <button type="submit" className="quiet-button">Aplicar</button>
        </form>
      </header>

      <section className="intro" id="inicio">
        <div>
          <p className="eyebrow">ESPAÇO PESSOAL / {owner}</p>
          <h1>Seus documentos,<br />em um só lugar.</h1>
        </div>
        <p className="intro-note">Armazenados localmente.<br />Disponíveis quando você precisar.</p>
      </section>

      <section className="content" aria-label="Gerenciamento de documentos">
        <UploadComponent owner={owner} onUploaded={addDocument} />

        <div className="list-heading">
          <div>
            <p className="eyebrow">ARQUIVO PESSOAL</p>
            <h2>Documentos <span className="count">{documents.length}</span></h2>
          </div>
          <button
            className="quiet-button refresh-button"
            type="button"
            onClick={refreshDocuments}
            disabled={refreshing || loading}
            aria-label="Atualizar lista de documentos"
          >
            <span aria-hidden="true">↻</span> Atualizar
          </button>
        </div>

        {error && <p className="notice notice-error" role="alert">{error}</p>}
        {!error && <DocumentList documents={documents} loading={loading} owner={owner} />}
      </section>

      <footer className="footer">
        <span>ARQUIVO PESSOAL</span>
        <span>ARMAZENAMENTO LOCAL</span>
      </footer>
    </main>
  );
}
