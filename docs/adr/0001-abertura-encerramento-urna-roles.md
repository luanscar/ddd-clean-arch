# ADR-0001: Abertura e encerramento de urna — perfis autorizados (D1)

## Status

Aceite — 2026-04-02

## Contexto

- Regimentos e práticas de câmaras variam: a **secretaria/operador** regista no sistema o ato que, na mesa, foi proferido pelo **Presidente da sessão**.
- O produto distingue `PLENARY_OPERATOR` (e `ADMIN` do inquilino) do papel institucional de **Presidente da sessão** (`DeliberativeSession.presidentId` → `Parliamentarian` → `userId`).
- É necessário definir **quem pode** chamar as rotas que criam/abrem e encerram urnas sem ambiguidade para API, testes e auditoria.

## Decisão

1. **Sempre autorizados** à gestão de urnas (abrir via `POST /v1/legislative/propositions/:propositionId/polls`, encerrar via `PATCH /v1/polls/:pollId` com corpo adequado): utilizadores com papel **`admin`** ou **`plenary_operator`** do inquilino (conjunto `PLENARY_STAFF` em [`apps/backend/src/auth/rbac.constants.ts`](../../apps/backend/src/auth/rbac.constants.ts)).

2. **Também autorizado** o utilizador que for o **Presidente da sessão** de **pelo menos uma** sessão que inclua a proposição na pauta: o `userId` do JWT deve coincidir com `session.president.userId` do parlamentar presidente, e o presidente deve estar **ativo**. Esta regra aplica-se a utilizadores com papel que permita ser parlamentar (`parliamentarian` ou `member`), conforme `PollManagementGuard`.

3. A verificação do ponto 2 é feita em **`PollManagementGuard`** ([`apps/backend/src/auth/guards/poll-management.guard.ts`](../../apps/backend/src/auth/guards/poll-management.guard.ts)), aplicado às rotas sensíveis de criação de urna e encerramento (além de `JwtAuthGuard` / `RolesGuard` onde aplicável).

4. **`admin`** não é caminho “normal” para operar urna no plenário; uso para urna fica para **break-glass** documentado em operação, se alguma vez necessário.

## Consequências

- A matriz §2.4 do MVP permanece válida em espírito; a coluna “Presidência” traduz-se em **presidente da sessão na base de dados**, não só num papel JWT genérico.
- **D3** (flag por tenant para desativar operador de plenário nesta ação) continua em backlog e pode restringir o conjunto do ponto 1 sem alterar o ponto 2, conforme produto.

## Referências

- [`docs/mvp-sessao-votacao.md`](../mvp-sessao-votacao.md) §2.3, §2.4, §8 (D1)
