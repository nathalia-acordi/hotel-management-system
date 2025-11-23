# CI/CD Pipeline

Este documento descreve o pipeline CI/CD configurado para o projeto `hotel-management-system`.

## Visão Geral

- Branches:
  - `main` -> produção
  - `develop` -> desenvolvimento
- Workflows:
  - `.github/workflows/ci-cd.yml` -> testes, build e push de imagens para Docker Hub
  - `.github/workflows/docs.yml` -> gera JSON do Swagger a partir dos YAMLs e commita em `docs/swagger/`

## Stages do Pipeline (`ci-cd.yml`)

1. Test
   - Executa em matriz (matrix) para os serviços: `gateway`, `user`, `auth`, `reservation`, `payment`, `room`.
   - Usa `npm ci` e `npm run coverage` (o `package.json` de cada serviço contém `jest.coverageThreshold` configurado para 80%).
   - Se coverage for abaixo do threshold o job falha.

2. Build and Push
   - Faz login no Docker Hub com `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` (secrets).
   - Constrói e faz push das imagens para o Docker Hub com tag `latest` para `main` e `develop` para `develop`.

3. Deploy (simulado)
   - Apenas executa `echo` como placeholder. Neste ponto você pode colocar a lógica real de deploy (SSH/Ansible/Capistrano/etc.).

## Secrets Necessários (GitHub)

- `DOCKERHUB_USERNAME` - usuário do Docker Hub
- `DOCKERHUB_TOKEN` - token/password do Docker Hub
- `MONGODB_URI` - URI do MongoDB (Atlas)
- `JWT_SECRET` - segredo JWT para ambiente CI (se necessário nos testes)

## Como funciona a verificação de coverage

Cada `package.json` dos serviços inclui a configuração `jest.coverageThreshold` com 80% para branches, functions, lines e statements. O job de testes executa `npm run coverage` e o Jest irá falhar caso a cobertura esteja abaixo do threshold.

## Prometheus + Grafana (monitoramento)

- Arquivos incluídos:
  - `docker-compose.yml` foi atualizado para incluir Prometheus e Grafana
  - `prometheus.yml` contém a configuração para scrape a cada 15s dos serviços
  - `grafana/dashboards/services-dashboard.json` é um dashboard inicial com painéis de taxa de requisições, latência e erros

## Como adicionar um novo serviço ao pipeline

1. Adicione a pasta `services/<nome>` com `Dockerfile` e `package.json`.
2. Atualize a matriz do job `test` em `.github/workflows/ci-cd.yml` adicionando o novo serviço.
3. Atualize o bloco de `build_and_push` para construir e taggear a nova imagem.
4. Adicione o serviço ao `prometheus.yml` para scraping e ao `docker-compose.yml` se desejar executá-lo localmente com Prometheus/Grafana.

## Troubleshooting

- Se o job de build falhar por limites do Docker Hub: verifique rate limits ou use um runner com mais recursos.
- Se os testes em CI falharem por falta de `MONGODB_URI`: adicionar o secret `MONGODB_URI` no repositório GitHub e garantir que os testes usem emulação (mongodb-memory-server) quando aplicável.

## Notas finais

- O workflow criado prioriza simplicidade e rapidez: se precisar de deploy real, substitua o job `deploy` por passos que façam deploy no seu ambiente (servidores, cloud provider, etc.).
- O dashboard Grafana é apenas um ponto de partida e pode ser melhorado conforme métricas específicas de negócio.
