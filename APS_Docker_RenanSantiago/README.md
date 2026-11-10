# APS - Docker, API e Banco de Dados

Implementação escolhida: **Node.js (Express) + PostgreSQL 16**.

## Estrutura

- `node-service/`: código da API, Swagger UI, Dockerfile e .dockerignore.
- `docker-compose.yml`: orquestra a API e o PostgreSQL.
- `pgdata`: volume nomeado para persistência dos dados do banco.

## Requisitos

Docker Desktop instalado e em execução.

## Como executar

Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

A documentação interativa estará em: http://localhost:3000/docs

## Testar a API

No Swagger UI, abra `POST /api/v1/tarefas`, clique em **Try it out** e use, por exemplo:

```json
{
  "titulo": "Minha primeira tarefa",
  "descricao": "Teste de persistência no PostgreSQL",
  "prioridade": "ALTA"
}
```

Execute o `GET /api/v1/tarefas` para conferir o registro.

## Validar persistência

1. Cadastre uma tarefa pelo Swagger.
2. Execute `docker compose down` (não use `-v`).
3. Execute `docker compose up -d`.
4. Consulte novamente `GET /api/v1/tarefas` em http://localhost:3000/docs.

A tarefa continuará salva porque os dados ficam no volume nomeado `pgdata`.

> **Atenção:** `docker compose down -v` remove também o volume e apaga os dados persistidos.

## Encerrar

```bash
docker compose down
```
