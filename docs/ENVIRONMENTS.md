# Environments (Desenvolvimento / Produção)

Este documento descreve como este repositório usa *GitHub Environments* para separar `development` e `production` e como configurar secrets e aprovações.

## Objetivo
- Segregar segredos sensíveis por ambiente (ex.: URIs de banco, chaves de produção).
- Permitir que jobs de CI/Actions sejam marcados com um `environment` específico.
- Exigir revisores para jobs que rodem contra `production` (aprovacao manual antes do deploy).

## Environments sugeridos
- `development` — usado para validações automáticas (build, tests, Sonar scan).
- `production` — usado para deploys reais; deve ter secrets de produção e `Required reviewers`.

## Como criar um environment
1. Acesse o repositório no GitHub.
2. Vá em `Settings` → `Secrets and variables` → `Environments`.
3. Clique em `New environment` e crie `development` e `production`.

## Segredos (Secrets)
- `Repository secrets`: manter tokens e segredos compartilhados (ex.: `SONAR_TOKEN`).
- `Environment secrets`: guardar segredos específicos do ambiente (ex.: `PROD_DB_URI`, `PROD_RABBITMQ_URL`).

### Recomendações
- Não mova `SONAR_TOKEN` para o environment `production` — mantenha como `Repository secret` se for usado por jobs de análise em `development`.
- Coloque apenas segredos exclusivos de produção em `production`.

## Proteger produção (Required reviewers)
- Em `production` → `Environment protection` → `Required reviewers` adicione as pessoas ou equipes que devem aprovar deploys.
- Quando um job na workflow declara `environment: production` e a proteção exige reviewers, o job ficará pendente até que um dos reviewers aprove.

## Como os jobs usam environments
- No workflow, adicione a linha `environment: development` (ou `production`) no job:

```yaml
jobs:
  analyze:
    runs-on: ubuntu-latest
    environment: development
    steps: ...

  deploy-prod:
    runs-on: ubuntu-latest
    environment: production
    steps: ...
```

## Testando sem riscos
- Adicione `environment: development` ao job de análise (já aplicado neste repositório).
- Crie um PR e verifique se o job roda normalmente.
- Para `production`, configure `Required reviewers` e rode um job com `environment: production` para ver o fluxo de aprovação.

## Observações finais
- Esta configuração é segura porque não altera os comandos de build/test existentes — apenas adiciona metadados (`environment`) aos jobs.
- Se preferir, eu posso também atualizar o workflow para gerar/Agregate LCOVs para o SonarCloud (útil para cobertura). Basta pedir.
