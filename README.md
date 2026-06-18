# gooPlex

Local-first search: AI reasons about your query, SearXNG retrieves snippets, results are ranked — links out only, never answers.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10 (`packageManager` in root `package.json`)
- [Docker](https://www.docker.com/) (for SearXNG on port 8080)

If `pnpm install` fails with `ERR_PNPM_META_FETCH_FAIL` (registry timeout), re-run the install — transient registry issues are common.

## Setup

```bash
cp .env.example .env
```

## Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` builds `@gooplex/shared`, starts SearXNG via Docker, and runs the Fastify server (`:3001`) and Vite web app together. SearXNG may take a few seconds to warm up; the first search can briefly fail.

Verify SearXNG directly:

```bash
curl 'http://localhost:8080/search?q=test&format=json'
```

Health check: `curl http://localhost:3001/health`

## SearXNG secret key

`searxng/settings.yml` requires `server.secret_key`. Generate one for local use:

```bash
openssl rand -hex 32
```

Paste the value into `searxng/settings.yml` under `server.secret_key`. The repo ships a dev key; replace it if you expose the instance beyond localhost.

## Tests

```bash
pnpm test
```

Unit tests cover RRF merge and `sourceType` classification. Live SearXNG tests run when `http://localhost:8080` returns JSON results (start Docker first).
