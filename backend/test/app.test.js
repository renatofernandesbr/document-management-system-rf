const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const app = require('../src/app');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

async function startTestServer(options = {}) {
  const storageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const server = app.createApp({ storageDir, ...options }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    storageDir,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await fs.rm(storageDir, { recursive: true, force: true });
    }
  };
}

test('upload, listagem e download preservam o dono e os metadados', async () => {
  const server = await startTestServer();

  try {
    const form = new FormData();
    form.set('file', new Blob(['conteudo do documento']), 'relatorio.txt');
    const uploadResponse = await fetch(`${server.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': ' usuario-1 ' },
      body: form
    });
    const document = await uploadResponse.json();

    assert.equal(uploadResponse.status, 201);
    assert.equal(document.originalName, 'relatorio.txt');
    assert.equal(document.size, 21);
    assert.equal(document.owner, 'usuario-1');
    assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
    assert.equal('storedName' in document, false);

    const listResponse = await fetch(`${server.baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-1' }
    });
    assert.deepEqual((await listResponse.json()).documents, [document]);

    const otherUserList = await fetch(`${server.baseUrl}/documents`, {
      headers: { 'X-User-Id': 'usuario-2' }
    });
    assert.deepEqual((await otherUserList.json()).documents, []);

    const downloadResponse = await fetch(
      `${server.baseUrl}/documents/${document.id}/download`,
      { headers: { 'X-User-Id': 'usuario-1' } }
    );
    assert.equal(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
    assert.equal(await downloadResponse.text(), 'conteudo do documento');

    const forbiddenDownload = await fetch(
      `${server.baseUrl}/documents/${document.id}/download`,
      { headers: { 'X-User-Id': 'usuario-2' } }
    );
    assert.equal(forbiddenDownload.status, 404);
    assert.equal((await forbiddenDownload.json()).error.code, 'DOCUMENT_NOT_FOUND');
  } finally {
    await server.close();
  }
});

test('upload exige usuário e arquivo e aplica limite configurável', async () => {
  const server = await startTestServer({ maxFileSize: 4 });

  try {
    const noUserForm = new FormData();
    noUserForm.set('file', new Blob(['ok']), 'ok.txt');
    const noUserResponse = await fetch(`${server.baseUrl}/upload`, {
      method: 'POST',
      body: noUserForm
    });
    assert.equal(noUserResponse.status, 400);
    assert.equal((await noUserResponse.json()).error.code, 'USER_REQUIRED');
    assert.deepEqual(await fs.readdir(server.storageDir), []);

    const noFileResponse = await fetch(`${server.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-1' }
    });
    assert.equal(noFileResponse.status, 400);
    assert.equal((await noFileResponse.json()).error.code, 'FILE_REQUIRED');

    const tooLargeForm = new FormData();
    tooLargeForm.set('file', new Blob(['grande']), 'grande.txt');
    const tooLargeResponse = await fetch(`${server.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-1' },
      body: tooLargeForm
    });
    assert.equal(tooLargeResponse.status, 413);
    assert.equal((await tooLargeResponse.json()).error.code, 'FILE_TOO_LARGE');
  } finally {
    await server.close();
  }
});

test('valida identidade e não usa o nome original como caminho físico', async () => {
  const server = await startTestServer();

  try {
    const invalidUserForm = new FormData();
    invalidUserForm.set('file', new Blob(['ok']), 'ok.txt');
    const invalidUserResponse = await fetch(`${server.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': `${'a'.repeat(129)}` },
      body: invalidUserForm
    });
    assert.equal(invalidUserResponse.status, 400);
    assert.equal((await invalidUserResponse.json()).error.code, 'INVALID_USER');

    const traversalForm = new FormData();
    traversalForm.set('file', new Blob(['seguro']), '../fora-do-storage.txt');
    const uploadResponse = await fetch(`${server.baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'usuario-1' },
      body: traversalForm
    });
    const document = await uploadResponse.json();

    assert.equal(uploadResponse.status, 201);
    assert.equal(document.originalName, 'fora-do-storage.txt');
    assert.deepEqual((await fs.readdir(server.storageDir)).length, 1);
  } finally {
    await server.close();
  }
});

test('rejeita limite de arquivo inválido na configuração', () => {
  assert.throws(() => app.createApp({ maxFileSize: 0 }), /inteiro positivo/);
  assert.throws(() => app.createApp({ maxFileSize: Number.NaN }), /inteiro positivo/);
});
