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
- **Corpo:** Registar decisão em `docs/` ou `DOMAIN.md`: perfis que podem chamar abertura; mesma transação vs saga vs eventual para `StartPropositionVoting` + `ICreateLegislativePoll`. Depois ajustar guards/RBAC conforme ADR.
- **Refs:** MVP §8 decisões pendentes

---

### 3. MVP-05 — CRUD completo de parlamentares

- **Título:** `feat(legislative): CRUD parlamentares (update, desativação/suplência)`
- **Corpo:** Completar além de `RegisterParliamentarian`: atualizar dados, política de soft delete, regras de suplência conforme Câmara; testes e rotas HTTP; isolamento por `TenantId`.
- **Refs:** MVP-05, EDT-4.2.1.a

---

### 4. MVP-06 — Papéis ADMIN / OPERATOR e RBAC no backend

- **Título:** `feat(identity+backend): papéis admin/operador e matriz RBAC mínima`
- **Corpo:** Modelar papéis no Identity; aplicar `@Roles()` ou equivalente nas rotas sensíveis (abrir/fechar urna, pauta, cadastros); documentar matriz mínima no MVP ou ADR.
- **Refs:** MVP-06, EDT-4.2.1.b

---

### 5. MVP-08 — Ordem do dia rica (tipos, reordenação, expedientes)

- **Título:** `feat(legislative): tipos de expediente, reordenar pauta, evoluir agenda`
- **Corpo:** CRUD além de “adicionar proposição à sessão”: tipos de item (EDT-4.3.c), ordenação, regras de elegibilidade para MVP-01; queries para ordem do dia conforme critérios MVP-08. PDF/anexos (EDT-4.3.d) podem ficar sub-issue.
- **Refs:** MVP-08, EDT-4.3.a,c + 4.4.a-c

---

### 6. MVP-07 — Leitura / tempo real para painéis

- **Título:** `feat: projeções + canal tempo real (SSE ou WebSocket) para votação`
- **Corpo:** Definir canal (documentar em MVP §7); queries de leitura agregada/nominal conforme política LGPD; sem violar invariantes de escrita do Voting.
- **Refs:** MVP-07, EDT-4.2.1.d, 4.6, 4.4.i

---

### 7. MVP-09 — Relatórios e exportação básica

- **Título:** `feat: relatórios sessão (PDF ou equivalente) e exportação`
- **Corpo:** Relatórios por sessão/intervalo; isolamento por tenant e perfil; performance alvo a definir (NFR).
- **Refs:** MVP-09, EDT-4.3.o, 4.7

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
