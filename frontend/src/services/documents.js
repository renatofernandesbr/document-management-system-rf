const API_BASE = '/api';

async function readError(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, options);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response;
}

export async function getDocuments(owner, signal) {
  const response = await request('/documents', {
    headers: { 'X-User-Id': owner },
    signal
  });
  const body = await response.json();
  return body.documents;
}

export async function uploadDocument(owner, file) {
  const formData = new FormData();
  formData.set('file', file);
  const response = await request('/upload', {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData
  });
  return response.json();
}

export async function downloadDocument(owner, documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`, {
    headers: { 'X-User-Id': owner }
  });
  let blobUrl;
  try {
    blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    const disposition = response.headers.get('content-disposition') || '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    let fileName = plainName || 'documento';

    if (encodedName) {
      try {
        fileName = decodeURIComponent(encodedName);
      } catch {
        fileName = plainName || 'documento';
      }
    }

    link.href = blobUrl;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    if (blobUrl) {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  }
}