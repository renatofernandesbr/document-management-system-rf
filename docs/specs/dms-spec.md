# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos por uma interface web, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos associados ao usuário da requisição.
- Download de um documento pelo identificador, limitado ao dono.
- Interface web para envio, listagem e download.
- Arquivos em armazenamento local e metadados em memória.

### Fora do escopo

- Autenticação, cadastro de usuários e gestão de credenciais.
- Armazenamento externo, nuvem ou serviços de upload de terceiros.
- Persistência de metadados após reinício do processo.
- Versionamento, edição, exclusão, busca e compartilhamento de documentos.
- Paginação e processamento ou conversão do conteúdo dos arquivos.

## 3. Premissas

- O backend recebe a identidade lógica pelo cabeçalho `X-User-Id`; esse cabeçalho não é autenticação e não é seguro para uso multiusuário em rede pública.
- Em desenvolvimento, o frontend chama a API pelo prefixo `/api`; o proxy do Vite encaminha as chamadas ao backend e remove esse prefixo.
- O limite padrão é 10 MiB por arquivo e pode ser configurado por variável de ambiente.
- São aceitos quaisquer tipos de arquivo dentro do limite. O download é feito como anexo.
- Metadados em memória são perdidos quando o processo reinicia; arquivos gravados podem permanecer no diretório sem registro associado.

## 4. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo pelo campo multipart `file`. |
| RF-02 | O backend gera identificador único e registra nome original, tamanho, data de upload e dono. |
| RF-03 | O usuário lista somente documentos associados ao seu `X-User-Id`. |
| RF-04 | A listagem é ordenada por data de upload decrescente. |
| RF-05 | O usuário baixa documento por identificador, desde que seja o dono. |
| RF-06 | Documento inexistente ou pertencente a outro usuário retorna `404`, sem revelar sua existência. |
| RF-07 | A interface oferece envio, listagem, download e estados de carregamento, sucesso e erro. |
| RF-08 | A API valida usuário, arquivo e identificador e retorna erros em JSON consistente. |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Backend Node.js e Express em CommonJS; frontend React e Vite em ESM. |
| RNF-02 | Arquivos gravados apenas no filesystem local via Multer com `diskStorage`, em `backend/storage` por padrão. |
| RNF-03 | Metadados mantidos em memória nesta fase; não usar banco de dados. |
| RNF-04 | Configurações operacionais fornecidas por variáveis de ambiente com valores padrão documentados. |
| RNF-05 | Limite padrão de upload de 10 MiB por arquivo; excedentes retornam `413`. |
| RNF-06 | Nome original nunca é usado como caminho físico; o nome interno é gerado pelo backend e o caminho local não é exposto. |
| RNF-07 | Erros de HTTP e filesystem são tratados nos limites do sistema. |
| RNF-08 | Testes backend usam o runner nativo `node:test`. |

## 6. Modelo de dados

### Documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | UUID gerado pelo backend e identificador público. |
| `originalName` | string | Nome original para exibição e download. |
| `size` | number | Tamanho em bytes. |
| `uploadedAt` | string | Data/hora em ISO 8601 UTC. |
| `owner` | string | Identificador obtido de `X-User-Id`. |
| `storedName` | string | Nome interno do arquivo; campo privado, não retornado pela API. |

Metadados são mantidos em uma coleção em memória indexada por `id`. O caminho do arquivo é derivado do diretório de armazenamento e de `storedName`.

### Configuração

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local dos arquivos. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Limite por arquivo. |

## 7. Contratos de API

Todas as rotas de documentos exigem `X-User-Id` não vazio, com espaços externos removidos. Cabeçalho ausente ou vazio retorna `400`. Erros usam o formato:

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "O arquivo excede o tamanho máximo permitido."
  }
}
```

### `POST /upload`

Recebe `multipart/form-data` com um arquivo no campo `file`.

Sucesso: `201 Created`.

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 48210,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": "usuario-123"
}
```

Retorna `400` se arquivo ou usuário estiver ausente ou a requisição for inválida; `413` quando exceder o limite; `500` em falha de filesystem. O nome físico do arquivo é gerado pelo backend.

### `GET /documents`

Retorna `200 OK` com documentos do usuário da requisição em ordem decrescente de `uploadedAt`.

```json
{
  "documents": [
    {
      "id": "uuid",
      "originalName": "relatorio.pdf",
      "size": 48210,
      "uploadedAt": "2026-09-29T12:00:00.000Z",
      "owner": "usuario-123"
    }
  ]
}
```

Sem documentos, retorna `200` com `documents: []`.

### `GET /documents/:id/download`

Retorna o arquivo binário como anexo com `Content-Disposition` baseado no nome original e `X-Content-Type-Options: nosniff`. Retorna `404` para ID inválido, inexistente ou de outro dono; falha ao ler arquivo retorna `500`. O parâmetro da rota nunca é usado como caminho de filesystem.

## 8. Decisões arquiteturais

- Backend dividido em `routes -> controllers -> services -> repositories`.
- `routes` registram endpoints e middleware Multer; controllers lidam com HTTP; services concentram regras; repositories encapsulam metadados e filesystem.
- Camadas internas não dependem do Express nem da apresentação.
- Frontend usa componentes funcionais com Hooks e serviço `fetch` centralizado sob `/api`.
- Símbolos de código em inglês; mensagens ao usuário em português.
- Não introduzir banco, armazenamento externo, autenticação ou abstrações desnecessárias.

## 9. Plano de execução

1. **Consolidar contratos e configuração.** Documentar configurações, erros, identidade e limite. Aceite: API e premissas estão definidos neste documento.
2. **Implementar upload e persistência local.** Criar rotas, controllers, serviços e repositórios com Multer `diskStorage` e metadados em memória. Aceite: upload válido persiste localmente; erros de entrada, limite e filesystem são tratados.
3. **Implementar listagem e download por usuário.** Aplicar isolamento por dono e resolução segura do arquivo. Aceite: listagem ordenada e downloads restritos ao dono.
4. **Implementar interface e integração.** Criar fluxos React de envio, listagem e download via `/api`. Aceite: estados de carregamento, sucesso e falha são comunicados em português.
5. **Validar comportamento e operação.** Cobrir contratos com `node:test` e verificar execução local. Aceite: testes cobrem sucesso e erros principais e as configurações são documentadas.

## 10. Riscos e limitações

- `X-User-Id` sem autenticação pode ser falsificado; não expor como serviço multiusuário confiável sem autenticação.
- Reinício do processo remove metadados da memória e pode deixar arquivos órfãos no disco.
- Diretório local exige espaço e permissões adequados; não há retenção ou limpeza automática.
- A listagem não é paginada e pode crescer enquanto o processo permanecer ativo.