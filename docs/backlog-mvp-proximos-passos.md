# Backlog — próximos passos (MVP sessão / votação)

Este ficheiro liga o marco Git **`mvp-sessao-votacao-backend-2026-04`** ao trabalho ainda por fazer. Use como lista para **GitHub Issues** (copiar título + corpo) ou para o vosso board.

**Referência principal:** [`mvp-sessao-votacao.md`](mvp-sessao-votacao.md)  
**Marco:** tag `mvp-sessao-votacao-backend-2026-04` — backend Nest + Prisma com rotas da §11 (polls, legislative, sessão, pauta, e2e).

---

## Como criar issues no GitHub

1. Instalar [GitHub CLI](https://cli.github.com/): `brew install gh` → `gh auth login`
2. Para cada linha abaixo: **New issue** no repositório ou `gh issue create --title "..." --body-file -` colando o corpo sugerido.

---

## Issues sugeridas (ordem sugerida)

### 1. Documentação — alinhar §1 do MVP ao já entregue

- **Título:** `docs: marcar âmbito MVP §1 conforme backend §11`
- **Corpo:** Atualizar checkboxes e texto em `docs/mvp-sessao-votacao.md` secção 1 (Âmbito) para refletir o que já existe (Prisma, rotas, e2e). Manter “fora de âmbito” explícito.
- **Refs:** MVP doc §1, §11

---

### 2. ADR — D1 e D2 (abertura de urna e consistência)

- **Título:** `adr: quem abre urna (D1) e consistência legislative↔voting (D2)`
- **Corpo:** O ADR deve **anexar** (no corpo da issue ou ficheiro `docs/adr/`) a **matriz ação × perfil** (tabela §2.4 em [`mvp-sessao-votacao.md`](mvp-sessao-votacao.md)) e a decisão de **delegação** Presidência vs operador de plenário. Referenciar também §2.3 (atos institucionais) e §2.5 (variância entre câmaras). **Estado atual:** D1 e D2 já estão decididos na secção 8 do mesmo ficheiro; o ADR formaliza, congela e liga à implementação de guards (`@Roles` / política por tenant para `allowPlenaryOperatorToOpenPoll` ou equivalente).
- **Refs:** MVP §2, §8; implementação MVP-06

---

### 3. MVP-05 — CRUD completo de parlamentares _(fechado no backend)_

- **Estado:** entregue — rotas `LegislativeParliamentariansController`, soft delete (`active`), `includeInactive` para staff, `GET .../:id` oculta inativos a não-staff. Ver `docs/mvp-sessao-votacao.md` MVP-05.
- **Pós-MVP (nova issue):** regras de suplência específicas por cliente se exceder `ParliamentaryRole` + documentação.

---

### 4. MVP-06 — Papéis ADMIN / OPERATOR e RBAC no backend _(fechado no backend)_

- **Estado:** entregue — `UserRole` + `@Roles`/`rbac.constants.ts`; `PATCH /v1/users/:userId` (`UpdateTenantUserHandler`) para papel/ativo; proteção do último admin. Matriz em MVP §2.4.
- **Pós-MVP (nova issue):** ADR formal (item 2 deste backlog) e auditoria EDT-4.3.s.

---

### 5. MVP-08 — Ordem do dia rica (tipos, reordenação, expedientes)

- **Estado:** entregue no backend (slice texto + anexos em bucket): `title`/`description` em `SessionAgendaItem`, rotas de pauta, `POST/GET .../agenda-items/:itemId/attachments` com S3-compatível (`S3_AGENDA_BUCKET` / `AWS_S3_BUCKET`, etc.).
- **Pós-MVP:** UI de gestão de anexos, limites/NFR por tenant, antivirus em upload.
- **Refs:** MVP-08, EDT-4.3.a,c,d + 4.4.a-c

---

### 6. MVP-07 — Leitura / tempo real para painéis _(fechado no backend)_

- **Estado:** entregue — módulo `realtime` (snapshot público, SSE, nominal, fan-out por eventos de domínio). Ver `docs/mvp-sessao-votacao.md` §7 e §11.
- **Pós-MVP (nova issue):** WebSocket ou Socket.IO + Redis pub/sub para múltiplas instâncias e ligações persistentes além do SSE unidirecional.

---

### 7. MVP-09 — Relatórios e exportação básica _(em desenvolvimento)_

- **Estado:** **em desenvolvimento** — `GET /v1/legislative/sessions/:sessionId/report.pdf` em [`apps/backend/src/reports`](../apps/backend/src/reports); PDF inclui presenças quando há registos (`session_attendance`). Ver [`mvp-sessao-votacao.md`](mvp-sessao-votacao.md) §3 MVP-09 e §11.
- **Pós-slice atual:** relatório por intervalo de datas; export EDT-4.7.e; NFR de geração.

### 7b. Presença e quórum lean _(entregue no backend)_

- **Rotas:** `GET/POST/DELETE .../sessions/:sessionId/attendance`, `GET .../quorum` (maioria simples dos ativos do tenant). Modelo `session_attendance`; presença parte do agregado `DeliberativeSession` na camada de domínio.
- **Pós-MVP:** EDT-4.3.g formal (regras por regimento), biometria/PIN (EDT-4.4.f).

---

### 8. Resiliência — sync MVP-04 (retries / DLQ)

- **Título:** `chore: política de retentativas para SyncPropositionResultOnPollClosed`
- **Corpo:** Falhas de integração não corrompem Tally; definir retries, idempotência ou DLQ conforme MVP-04 notas.
- **Refs:** MVP-04

---

### 9. Testes — expandir e2e e contratos REST

- **Título:** `test(backend): e2e para RBAC, erros de tenant e edge cases de poll`
- **Corpo:** Ampliar `voting-flow.e2e-spec.ts` e/ou novos specs: 403/404 por tenant, idempotência abertura urna, fechamento duplicado, etc.
- **Refs:** MVP critérios de aceitação gerais

---

## Após publicar o marco

```bash
# na raiz do monorepo (e no remoto do submódulo apps/backend, se aplicável)
git push
git push origin mvp-sessao-votacao-backend-2026-04
```

Se `apps/backend` for repositório separado, faça push também dentro de `apps/backend` para o commit referenciado pelo monorepo.
