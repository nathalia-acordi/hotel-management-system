# SonarCloud Integration (instructions)

Este documento explica como ativar a integração com o SonarCloud para este repositório.

Arquivos adicionados:
- `sonar-project.properties` (na raiz) — contém placeholders para `sonar.organization` e `sonar.projectKey`.
- `.github/workflows/sonarcloud.yml` — workflow do GitHub Actions que executa testes e envia o scan para o SonarCloud.

Passos para ativar SonarCloud:

1. Crie uma conta em https://sonarcloud.io e registre um projeto para este repositório.
2. Na sua organização SonarCloud, anote a **Organization Key** (ex.: `my-org`) e o **Project Key** (ex.: `my-org_hotel-management-system`).
3. No GitHub do repositório, vá em Settings → Secrets & variables → Actions → New repository secret e adicione:
   - `SONAR_TOKEN` — token (crie em SonarCloud > My Account > Security).
   - `SONAR_PROJECT_KEY` — (opcional) Project Key se você preferir mantê-lo em secrets.
4. Atualize `sonar-project.properties` na raiz com `sonar.organization` e `sonar.projectKey`, ou mantenha os placeholders e informe os secrets conforme o workflow.
5. Faça push para `main` ou abra um pull request; o workflow `.github/workflows/sonarcloud.yml` será executado e enviará o relatório ao SonarCloud.

Notas:
- O workflow roda `npm ci` e `npm test --if-present` a partir da raiz. Se você precisa de etapas adicionais (ex.: instalar dependências por serviço), ajuste o workflow para executar scripts em `services/*`.
- Para monorepos, considere configurar análises por subprojeto ou ajustar `sonar.modules` no `sonar-project.properties`.
- Se quiser que eu atualize `sonar-project.properties` com suas chaves (organization/projectKey), passe os valores e eu atualizo o arquivo.

Ajuda/Próximos passos:
- Quer que eu preencha `sonar.organization` e `sonar.projectKey` neste repositório? (responda com as chaves ou confirme que fornecerá os secrets no GitHub).
- Quer que eu ajuste o workflow para executar builds/testes por serviço antes do scan? Informe se prefere um scan mais granular por service.
