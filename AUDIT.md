# Auditoria Completa do Projeto — Sistema de Plantoes DPI SUL

**Data:** 2026-03-03
**Projeto:** meu-app-svelte (Sistema de Plantoes DPI SUL)
**Stack:** SvelteKit 2 + Svelte 5 + Cloudflare Pages/D1 + Tailwind CSS 4

---

## 1. Resumo Executivo

O projeto e um sistema de registro e gerenciamento de plantoes policiais do Departamento de Policia do Interior Sul (DPI SUL) do Ceara. Utiliza autenticacao por token via email (OTP de 6 digitos), gerenciamento de sessoes no banco, e permite criar, retificar e imprimir relatorios de plantao.

**Pontos fortes:**
- Uso adequado de prepared statements (D1 bind) — sem SQL injection
- Autenticacao OTP com expiracão de token (15 min) e sessao (8h)
- Cookie seguro (httpOnly, secure, sameSite: lax)
- TypeScript com strict mode habilitado
- Bom uso do SvelteKit: layouts, server loads, form actions, progressive enhancement
- CI/CD com type checking e build validation
- Sistema de migrações organizado com tracking

**Pontos criticos que precisam de atencao:**
- Vulnerabilidades de seguranca (forca bruta, IDOR, limpeza de sessoes)
- Codigo duplicado extenso entre rotas
- Schema SQL legado nao utilizado (schema.sql, schema-plantao.sql)
- Ausencia de testes automatizados
- Problemas de acessibilidade

---

## 2. Arquitetura e Configuracao

### 2.1 Stack Tecnologico
| Componente | Versao | Status |
|---|---|---|
| SvelteKit | ^2.50.2 | OK |
| Svelte | ^5.51.0 | OK (Svelte 5 com runes) |
| Vite | ^7.3.1 | OK |
| Tailwind CSS | ^4.2.1 | OK (v4 com @tailwindcss/postcss) |
| TypeScript | ^5.9.3 | OK |
| Cloudflare D1 | via adapter-cloudflare | OK |

### 2.2 Problemas de Configuracao

**[BAIXO] `wrangler.toml` — `compatibility_date` desatualizado:**
- Atual: `2024-01-01`
- Recomendado: Atualizar para uma data mais recente (ex: `2025-09-01`) para ter acesso a APIs mais novas do Cloudflare Workers.

**[INFO] `tailwind.config.js` pode ser desnecessario:**
- Tailwind v4 com `@tailwindcss/postcss` geralmente nao precisa de `tailwind.config.js` separado. O `content` ja e detectado automaticamente. Considere remover para simplificar.

**[INFO] Schemas SQL legados na raiz:**
- `schema.sql` e `schema-plantao.sql` parecem ser versoes anteriores ao sistema de migracoes (`migrations/`). Podem causar confusao. Considere remove-los ou move-los para uma pasta `docs/` para referencia.

**[INFO] `database_id` exposto no `wrangler.toml`:**
- O ID do banco D1 (`007bd971-6629-47f9-a635-a54cd978c6c1`) esta no repositorio. Apesar de nao ser um segredo critico (requer acesso a conta Cloudflare), considere usar variavel de ambiente para ambientes de producao.

---

## 3. Seguranca

### 3.1 Vulnerabilidades Criticas

**[CRITICO] Forca bruta no OTP — Sem rate limiting:**
- `src/routes/login/+page.server.ts:110-178` — A acao `validarToken` nao limita tentativas.
- Um atacante pode tentar todos os 900.000 codigos de 6 digitos em poucas horas.
- **Recomendacao:** Implementar limite de tentativas (ex: 5 tentativas por email a cada 15 min). Apos exceder, invalidar o token e exigir novo.

**[CRITICO] IDOR — Acesso a plantoes de outros usuarios:**
- `src/routes/plantao/imprimir/[id]/+page.server.ts` — Qualquer usuario autenticado pode ver/imprimir o plantao de qualquer outro usuario apenas mudando o ID na URL.
- `src/routes/plantao/retificar/[id]/+page.server.ts` — Qualquer usuario pode retificar o plantao de outro.
- `src/routes/plantao/extra/[id]/+page.server.ts` — Mesma vulnerabilidade.
- **Recomendacao:** Verificar se `locals.usuario.matricula === plantao.matricula_responsavel` (ou se e admin) antes de permitir acesso.

**[ALTO] Dashboard sem controle de acesso adequado:**
- `src/routes/dashboard/+page.server.ts` — Qualquer usuario autenticado pode acessar o dashboard que mostra TODOS os plantoes de TODAS as delegacias.
- O hook (`hooks.server.ts:53`) so redireciona admin (`00000000`) quando tenta acessar `/plantao`, mas nao restringe `/dashboard` apenas a admins.
- **Recomendacao:** Adicionar verificacao `if (locals.usuario.matricula !== '00000000') throw redirect(302, '/plantao')` no load do dashboard.

**[ALTO] Token de desenvolvimento exposto na resposta:**
- `src/routes/login/+page.server.ts:101-102` — Quando `RESEND_API_KEY` nao esta configurado, o token OTP e retornado na resposta da action (`tokenDev`).
- Se a chave Resend nao for configurada em producao, o token fica visivel no HTML.
- **Recomendacao:** Adicionar uma flag explicita para ambiente de desenvolvimento (ex: `DEV_MODE` env var) em vez de inferir do RESEND_API_KEY.

### 3.2 Vulnerabilidades Medias

**[MEDIO] Sessoes expiradas nao sao limpas:**
- Nao ha mecanismo para limpar sessoes expiradas da tabela `sessoes`. Com o tempo, a tabela vai crescer indefinidamente.
- **Recomendacao:** Criar um cron job (Cloudflare Cron Triggers) para limpar sessoes com `expira_em < datetime('now')`.

**[MEDIO] Tokens expirados nao sao limpos:**
- Mesma situacao para `tokens_acesso` — tokens com status 'pendente' e expiracao passada nunca sao removidos.
- **Recomendacao:** Limpar junto com as sessoes.

**[MEDIO] Rota raiz (`/`) redireciona para `/plantao` incondicionalmente:**
- `src/routes/+page.server.ts` — Admin tambem e redirecionado para `/plantao`, que depois o hook redireciona para `/dashboard`. Isso causa um redirect duplo.
- **Recomendacao:** Verificar no `+page.server.ts` da raiz se o usuario e admin e redirecionar direto para `/dashboard`.

**[MEDIO] Logout via GET e vulneravel a CSRF:**
- `src/routes/logout/+page.server.ts` — O logout e feito via `load` (GET). Um atacante pode forcar o logout de um usuario apenas fazendo-o visitar um link ou imagem com src="/logout".
- **Recomendacao:** Implementar logout via form action (POST) com CSRF token nativo do SvelteKit.

### 3.3 Boas Praticas Implementadas
- Prepared statements com `.bind()` — Sem SQL injection
- Cookie de sessao com `httpOnly: true, secure: true, sameSite: 'lax'`
- Token OTP com expiracao de 15 minutos
- Sessao com expiracao de 8 horas
- Invalidacao de tokens anteriores ao gerar novo
- Validacao de entrada no formulario de plantao (horarios, campos obrigatorios)

---

## 4. Banco de Dados

### 4.1 Schema Principal (`migrations/0001_initial_schema.sql`)

**Tabelas:** `servidores`, `delegacias`, `tokens_acesso`, `sessoes`, `plantoes`, `plantoes_equipe`, `plantoes_procedimentos`, `rascunhos`, `remocoes`

**[MEDIO] Tabela `remocoes` legada:**
- Definida como "mantida para compatibilidade" mas nunca referenciada em nenhuma rota server-side. Considere remover em uma migracao futura.

**[MEDIO] Tabela `rascunhos` nao utilizada corretamente:**
- A action `carregarRascunho` em `/plantao/+page.server.ts:82-110` busca rascunhos na tabela `rascunhos`, porem a action `salvar` nunca insere dados nesta tabela. Ela insere na tabela `plantoes` com status `rascunho`.
- Isso significa que a funcionalidade de "carregar rascunho por codigo R-XXXXXX" nunca vai funcionar, pois a tabela esta sempre vazia.
- **Recomendacao:** Ou implementar a insercao na tabela `rascunhos` ao salvar como rascunho, ou remover a tabela e a action de carregar rascunho.

**[BAIXO] Falta constraint NOT NULL em campos importantes de `plantoes`:**
- `protocolo` pode ser NULL (e atualizado apos INSERT). Considere usar `DEFAULT ''`.
- `matricula_responsavel` e `nome_responsavel` podem ser NULL.

**[BAIXO] Falta ON DELETE CASCADE em `plantoes_procedimentos`:**
- A migracao define `FOREIGN KEY (plantao_id) REFERENCES plantoes(id)` sem `ON DELETE CASCADE`, diferente de `plantoes_equipe` (que tambem nao tem no migration, apenas no schema antigo).
- Na pratica, o D1 nao aplica foreign keys por padrao; porem, para consistencia, considere adicionar.

### 4.2 Indices
Os indices estao bem definidos para as queries mais comuns:
- `idx_plantoes_status`, `idx_plantoes_data`, `idx_plantoes_matricula`
- `idx_equipe_plantao`, `idx_procedimentos_plantao`
- `idx_sessoes_session_id`, `idx_tokens_email`
- `idx_servidores_matricula`, `idx_rascunhos_codigo`

---

## 5. Codigo Server-Side

### 5.1 Hooks (`src/hooks.server.ts`)

**[OK]** Autenticacao centralizada via handle hook.
**[OK]** Redireciona para login com `redirect` param para retorno apos autenticacao.
**[MEDIO]** Admin check limitado — so bloqueia `/plantao`, deveria restringir todas as rotas nao-admin de acessar dashboard.

### 5.2 Rotas Server

**[INFO] `src/routes/plantao/+page.server.ts` — Action `salvar`:**
- Gera protocolo em duas etapas (INSERT + UPDATE), o que pode causar registros sem protocolo se o UPDATE falhar.
- **Recomendacao:** Usar uma transacao (D1 batch) para garantir atomicidade.

**[MEDIO] `src/routes/plantao/retificar/[id]/+page.server.ts` — Retificacao in-place:**
- A retificacao modifica o registro original em vez de criar um novo registro. Isso perde o historico do plantao original.
- Se o campo `retificacao_de` na tabela `plantoes` era destinado a apontar para o original, ele nunca e usado.
- **Recomendacao:** Considere criar um novo registro com `retificacao_de = originalId` e marcar o original como "retificado", preservando o historico.

---

## 6. Codigo Client-Side

### 6.1 Duplicacao de Codigo

**[ALTO] Formulario de plantao duplicado (~1000 linhas cada):**
- `src/routes/plantao/+page.svelte` (~1050 linhas)
- `src/routes/plantao/retificar/[id]/+page.svelte` (~1000 linhas)
- ~90% do codigo e identico. Qualquer correcao precisa ser feita em ambos os arquivos.
- **Recomendacao:** Extrair o formulario para um componente reutilizavel `$lib/components/FormularioPlantao.svelte`.

**[MEDIO] Funcao `formatarData` duplicada em 4 arquivos:**
- `dashboard/+page.svelte`, `plantao/imprimir/[id]/+page.svelte`, `plantao/extra/[id]/+page.svelte`, `plantao/retificar/[id]/+page.svelte`
- **Recomendacao:** Mover para `$lib/utils/formatarData.ts`.

**[MEDIO] Tipo `Plantao` duplicado:**
- Definido localmente em `dashboard/+page.svelte` e implicitamente em outros arquivos.
- **Recomendacao:** Mover para `$lib/types/plantao.ts`.

### 6.2 Layout e Navegacao

**[BAIXO] Dashboard tem header proprio alem do layout:**
- `src/routes/dashboard/+page.svelte` renderiza seu proprio header com "DPI SUL", botoes, etc., enquanto o `+layout.svelte` ja tem uma barra de navegacao para rotas autenticadas. Isso pode causar duplicacao visual de elementos.

**[BAIXO] Link "Extra" no dashboard aponta para rota errada:**
- `dashboard/+page.svelte:351-353` — O link "Extra" aponta para `/plantao/imprimir/{p.id}` em vez de `/plantao/extra/{p.id}`.

### 6.3 Acessibilidade

**[MEDIO] Tabelas sem `<caption>` ou `aria-label`:**
- As tabelas do dashboard e dos relatorios de impressao nao tem descricao acessivel.

**[MEDIO] Modais sem trap de foco:**
- Os modais de configuracao do relatorio extra nao prendem o foco dentro do modal, permitindo que usuarios de teclado naveguem para elementos atras do modal.

**[BAIXO] Emojis usados como icones sem `aria-hidden`:**
- Botoes como "Imprimir", "Extra", "Retificar" usam emojis que serao lidos por screen readers.

---

## 7. Performance

**[MEDIO] Dashboard carrega TODOS os plantoes com JOINs:**
- `src/routes/dashboard/+page.server.ts:22-45` — A query faz LEFT JOIN com equipe e procedimentos para TODOS os plantoes (limitado apenas pela paginacao).
- A query de estatisticas tambem faz um full table scan (`SELECT ... FROM plantoes` sem WHERE).
- Com milhares de registros, isso pode ficar lento.
- **Recomendacao:** Adicionar filtros server-side (atualmente os filtros sao todos client-side, o que significa que so funcionam dentro da pagina atual de 30 registros).

**[MEDIO] Filtros do dashboard sao apenas client-side:**
- Os filtros (busca, status, delegacia, data, servidor, tipo de procedimento) filtram apenas os 30 registros carregados na pagina atual.
- Um usuario nao vai encontrar um plantao especifico se ele estiver em outra pagina.
- **Recomendacao:** Migrar filtros para query params server-side.

**[BAIXO] `GROUP_CONCAT` pode gerar strings muito grandes:**
- Se um plantao tiver muitos membros de equipe, `GROUP_CONCAT(DISTINCT e.nome_servidor)` pode retornar uma string enorme.

---

## 8. CI/CD e Deploy

### 8.1 GitHub Actions (`.github/workflows/ci.yml`)

**[OK]** Type check com `svelte-check`
**[OK]** Build validation
**[OK]** Node 20 com cache npm

**[MEDIO] Faltam testes automatizados:**
- Nao ha nenhum framework de testes configurado (sem vitest, sem playwright).
- **Recomendacao:** Adicionar vitest para testes unitarios (parseFormData, validarHorarios) e playwright para testes e2e.

**[BAIXO] Sem lint/format:**
- Nao ha ESLint ou Prettier configurados no CI.
- **Recomendacao:** Adicionar ao menos eslint com o plugin svelte.

### 8.2 Deploy
- Cloudflare Pages via `adapter-cloudflare` — OK
- D1 database binding — OK
- Scripts de migracao local/remoto — OK

---

## 9. Inventario de Problemas por Prioridade

### Criticos (resolver imediatamente)
1. **Forca bruta no OTP** — Sem rate limiting na validacao do token de 6 digitos
2. **IDOR em plantoes** — Qualquer usuario pode ver/retificar plantoes de outros

### Altos (resolver em breve)
3. **Dashboard sem restricao de acesso** — Qualquer usuario ve todos os plantoes
4. **Token dev exposto** — OTP pode vazar em producao se RESEND nao configurado
5. **Formulario duplicado ~2000 linhas** — Manutencao muito dificil

### Medios (melhorar progressivamente)
6. Limpeza de sessoes/tokens expirados
7. Logout via GET (vulneravel a CSRF)
8. Rascunhos nunca sao inseridos na tabela `rascunhos`
9. Retificacao perde historico do plantao original
10. Filtros do dashboard apenas client-side
11. Funcoes e tipos duplicados entre arquivos
12. Falta de testes automatizados
13. Acessibilidade dos modais e tabelas
14. Redirect duplo para admin na rota raiz

### Baixos (quando possivel)
15. `compatibility_date` desatualizado no wrangler.toml
16. Schemas SQL legados na raiz do projeto
17. Link "Extra" no dashboard aponta para rota errada
18. `tailwind.config.js` possivelmente desnecessario
19. Falta lint/format no CI

---

## 10. Recomendacoes Estrategicas

1. **Seguranca primeiro:** Corrigir IDOR e rate limiting sao prioridade absoluta antes de ir para producao.
2. **Componentizacao:** Extrair o formulario de plantao para um componente reutilizavel eliminara ~1000 linhas de codigo duplicado.
3. **Testes:** Adicionar vitest para logica de negocio (parseFormData, validarHorarios) e playwright para fluxo de login/criacao de plantao.
4. **Filtros server-side:** Migrar filtros do dashboard para query params processados no server, tornando a busca funcional em todo o dataset.
5. **Housekeeping:** Cron job para limpar sessoes e tokens expirados, remover tabelas legadas.
