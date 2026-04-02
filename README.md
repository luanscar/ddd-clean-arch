# ddd-clean-arch

Monorepo [Turborepo](https://turborepo.dev) com apps e pacotes de **DDD / Clean Architecture** (identity, voting, legislative, shared-kernel, etc.).

## Requisitos

- **Node.js** 18+ (recomendado: 22 — ver `.nvmrc`)
- **npm** 11+ (definido em `packageManager` no `package.json`)

## Setup

```sh
npm ci
```

### Backend (`apps/backend`)

O pacote `@repo/env` valida variáveis na carga do módulo. Para desenvolver ou compilar o backend, cria `apps/backend/.env` com pelo menos:

- `DATABASE_URL` — URL PostgreSQL válida
- `JWT_SECRET` — string com 8+ caracteres

## Scripts (raiz)

| Comando | Descrição |
|--------|------------|
| `npm run build` | Build de todos os pacotes/apps (via Turbo) |
| `npm run dev` | Modo desenvolvimento |
| `npm run lint` | ESLint / checagens em todos os workspaces |
| `npm run lint:ci` | Lint como no CI (exclui `backend` até a dívida ESLint lá ser sanada) |
| `npm run check-types` | `tsc --noEmit` nos workspaces |
| `npm run test` | Testes (ex.: Jest no backend) |
| `npm run format` | Prettier em `ts`, `tsx`, `md` |

Filtrar um workspace:

```sh
npx turbo run build --filter=@repo/voting
```

## CI

O pipeline em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) executa, em cada push/PR para `main` (ou `master`): **lint → typecheck → test → build**, com variáveis de ambiente mínimas para o backend.

## Estrutura (resumo)

- `apps/backend` — NestJS + Prisma
- `apps/web`, `apps/docs` — Next.js
- `packages/*` — bounded contexts e kernel partilhado

Documentação adicional do Turborepo: [turborepo.dev](https://turborepo.dev/docs).
