## Descrição

<!-- O que mudou e porquê (contexto / issue). -->

## Tipo de mudança

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `refactor` — refactor sem mudar comportamento
- [ ] `chore` / `docs` / `test` — manutenção, docs ou testes

## Checklist

- [ ] `npm run lint:ci` passa (espelha o CI; o `backend` ainda está excluído até sanar ESLint em `apps/backend/src`)
- [ ] `npm run check-types` passa
- [ ] Testes relevantes passam (`npx turbo run test` quando aplicável)
- [ ] `npx turbo run build` passa
- [ ] Commits seguem [Conventional Commits](https://www.conventionalcommits.org/) (ex.: `feat(scope): …`)

## Notas para revisores

<!-- Riscos, decisões de arquitetura, follow-ups. -->
