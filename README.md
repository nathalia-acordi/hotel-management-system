
# 🏨 Hotel Management System

<a href="https://nodejs.org/" target="_blank"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/></a>
<a href="https://expressjs.com/" target="_blank"><img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/></a>
<a href="https://www.docker.com/" target="_blank"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/></a>
<a href="https://www.rabbitmq.com/" target="_blank"><img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" alt="RabbitMQ"/></a>
<a href="https://jestjs.io/" target="_blank"><img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest"/></a>
<a href="https://github.com/jest-community/supertest" target="_blank"><img src="https://img.shields.io/badge/Supertest-333?style=for-the-badge&logo=jest&logoColor=white" alt="Supertest"/></a>
<a href="https://axios-http.com/" target="_blank"><img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios"/></a>
<a href="https://jwt.io/" target="_blank"><img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/></a>
<a href="https://restfulapi.net/" target="_blank"><img src="https://img.shields.io/badge/REST%20API-02569B?style=for-the-badge&logo=api&logoColor=white" alt="REST API"/></a>
<a href="https://en.wikipedia.org/wiki/SOLID" target="_blank"><img src="https://img.shields.io/badge/SOLID-ff9800?style=for-the-badge&logoColor=white" alt="SOLID"/></a>

<div align="center">

  <img src="https://img.shields.io/badge/Clean%20Architecture-1976d2?style=for-the-badge&logo=cloudsmith&logoColor=white" alt="Clean Architecture"/>
  <img src="https://img.shields.io/badge/GoF%20Patterns-f7c873?style=for-the-badge&logoColor=white" alt="GoF Patterns"/>

<br>
  <br/>

  <img src="https://img.shields.io/badge/User%20Tests-95%25-4caf50?style=for-the-badge&labelColor=222&logo=jest&logoColor=white" alt="User Test Coverage"/>
  <img src="https://img.shields.io/badge/Room%20Tests-83%25-4caf50?style=for-the-badge&labelColor=222&logo=jest&logoColor=white" alt="Room Test Coverage"/>
  <img src="https://img.shields.io/badge/Payment%20Tests-83%25-4caf50?style=for-the-badge&labelColor=222&logo=jest&logoColor=white" alt="Payment Test Coverage"/>
  <img src="https://img.shields.io/badge/Reservation%20Tests-56%25-f44336?style=for-the-badge&labelColor=222&logo=jest&logoColor=white" alt="Reservation Test Coverage"/>

</div>


</div>


## ✨ Principais Funcionalidades

- Gestão de hóspedes, recepcionistas e administradores com permissões distintas
- API Gateway centralizando entrada, autenticação e proxy
- Cadastro e autenticação de usuários (JWT)
- Gerenciamento de quartos (criação, edição, remoção, tipos, manutenção)
- Reservas com validação de disponibilidade, datas e regras de negócio
- Pagamento de reservas com aplicação de descontos (Strategy Pattern)
- Check-in e check-out controlados por regras e status
- Relatórios de ocupação, faturamento e auditoria
- Comunicação entre microsserviços via REST e eventos assíncronos (RabbitMQ)
- Arquitetura limpa, SOLID e padrões GoF aplicados
- Alta cobertura de testes unitários, integração e end-to-end (executáveis via Docker)

## Estrutura do Projeto

```text
hotel-management-system/
├── services/           # Microsserviços (user, auth, room, reservation, payment, gateway)
├── integration/        # Testes de integração entre microsserviços
├── docker-compose.yml  # Orquestração dos serviços e mensageria (sem Mongo container)
└── README.md           # Este guia
```

## 🏗️ Microsserviços

| Microsserviço | Função |
| ------------ | ------ |
| **gateway** | Entrada única; autenticação e proxy para os microsserviços. |
| **user** | Gerencia usuários/hóspedes, cadastro, validações (CPF/RG), perfis e integração com Auth. |
| **reservation** | Controla reservas (datas, disponibilidade), conflitos, cancelamentos; integra com Room/Payment. |
| **room** | Gerencia quartos, tipos e status (livre/ocupado/manutenção), atendendo o Reservation. |
| **payment** | Processa pagamentos, aplica descontos (Strategy), valida status e registra transações. |
| **auth** | Autenticação, geração/validação de JWT, login e integração com User. |

## 🗂️ Status dos Serviços

| Serviço      | Porta Host -> Container | Endpoint Principal         | Status |
|--------------|--------------------------|----------------------------|--------|
| gateway      | 3005 -> 3005             | /, /health                 | OK     |
| user         | 3000 -> 3000             | /users, /register          | OK     |
| auth         | 3001 -> 3001             | /login, /validate          | OK     |
| reservation  | 3002 -> 3000             | /reservations              | OK     |
| payment      | 3003 -> 3003             | /payments                  | OK     |
| room         | 3004 -> 3004             | /rooms                     | OK     |
| RabbitMQ     | 5672/15672               | AMQP/HTTP (console)        | OK     |

## 🎯 Permissões por Papel

| Ação                  | Admin | Receptionist | Guest |
|-----------------------|:-----:|:------------:|:-----:|
| Auto-cadastro         | ✗ | ✗ | ✓ |
| Cadastrar hóspede     | ✓ | ✓ | ✗ |
| Gerenciar reservas    | ✗ | ✓ | ✗ |
| Gerenciar quartos     | ✓ | ✓ | ✗ |
| Consultar relatórios  | ✓ | ✓ | ✗ |
| Efetuar pagamento     | ✓ | ✓ | ✗ |
| Check-in/out          | ✓ | ✓ | ✗ |
| Cancelar reserva      | ✗ | ✓ | ✗ |

## 🏛️ Padrões de Arquitetura

- Clean Architecture: separação clara entre camadas (Domain, Application, Infrastructure, Interfaces). Exemplos por serviço.
- GoF Patterns: Repository, Service, Factory e Strategy. Exemplos reais:
  - Repository: `services/user/src/infrastructure/UserRepository.js`
  - Service: `services/reservation/src/application/ReservationService.js`
  - Factory: `services/room/src/domain/RoomFactory.js`
  - Strategy: `services/payment/src/domain/strategy/PaymentStrategy.js`
- SOLID: foco em responsabilidade única e extensibilidade (ex.: novos métodos de pagamento sem alterar o core).
- Docker: cada microserviço em seu container; orquestração via `docker-compose.yml`.
- Mensageria: RabbitMQ para eventos e comunicação assíncrona (amqplib).

## 🧰 Requisitos

- Windows 10/11 com PowerShell 5.1+
- Docker Desktop 4.x com Docker Compose
- Node.js 20 LTS (opcional para rodar testes localmente por serviço)
- Conta/URI do MongoDB Atlas (sem container de Mongo em DEV)

## 🔑 Variáveis de ambiente

Crie um arquivo `.env.local` na raiz (baseado em `.env.local.sample`) com:

```
MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=altere_este_valor_no_seu_ambiente
```

Observações:
- Não usamos container de Mongo; a URI deve ser do Atlas.
- RabbitMQ é fornecido pelo docker compose; entre containers use `amqp://rabbitmq`.
- Em DEV há fallback de JWT_SECRET no compose, mas recomendo definir no `.env.local`.

## 🚀 Como Executar o Projeto (Docker)

Na raiz do projeto, execute no PowerShell:

```powershell
# Build + subir todos os serviços
docker compose up --build

# Dica: em versões antigas do Docker, use 'docker-compose'
# docker-compose up --build
```

Após os health checks ficarem verdes:
- Gateway: http://localhost:3005
- RabbitMQ UI: http://localhost:15672 (guest/guest)

## 🧭 Fluxo rápido (via API Gateway)

Endpoints principais do gateway:
- POST /register -> User Service
- POST /login -> Auth Service
- GET /validate -> valida JWT (Auth)
- Rotas protegidas: /users, /reservations, /rooms, /payments

Exemplos (PowerShell):

```powershell
# 1) Registrar um hóspede
$body = @{ name = 'Alice'; email = 'alice@example.com'; document = '12345678901'; password = 'Str0ng@Pass'; role = 'guest' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3005/register' -Method Post -ContentType 'application/json' -Body $body

# 2) Login
$login = @{ username = 'alice@example.com'; password = 'Str0ng@Pass' } | ConvertTo-Json
$resp = Invoke-RestMethod -Uri 'http://localhost:3005/login' -Method Post -ContentType 'application/json' -Body $login
$token = $resp.token

# 3) Validar token
Invoke-RestMethod -Uri 'http://localhost:3005/validate' -Headers @{ Authorization = "Bearer $token" } -Method Get

# 4) Rota protegida (ex.: quartos)
Invoke-RestMethod -Uri 'http://localhost:3005/rooms' -Headers @{ Authorization = "Bearer $token" } -Method Get
```

Se preferir curl (Windows):

```powershell
curl.exe -s -X POST http://localhost:3005/login -H "Content-Type: application/json" -d '{"username":"alice@example.com","password":"Str0ng@Pass"}' | ConvertFrom-Json
```

## 🧪 Executando os testes

Todos os serviços via Docker Compose (encerra quando os testes acabam):

```powershell
docker compose up --build --abort-on-container-exit --remove-orphans
```

Unit test por serviço (ex.: user):

```powershell
cd services/user
npm install
npm test
```

Notas:
- Testes usam ESM/Jest; alguns serviços têm setupFilesAfterEnv.
- Logs ruidosos sanitizados; erros em pt-BR.

## 📋 Requisitos do Sistema — Casos de Uso

<details>
<summary><b>UC01 — Auto-cadastro de Hóspede</b></summary>

**Ator Primário:** Hóspede

**Fluxo Principal:**
1. Hóspede acessa o endpoint `/register` do User Service.
2. Informa dados obrigatórios (nome, e-mail, documento, senha, etc).
3. Sistema valida:
  - Formato de e-mail, CPF/RG, telefone.
  - Unicidade de e-mail e documento.
  - Senha mínima e hash.
4. Sistema publica evento `user.created` no RabbitMQ.
5. Hóspede recebe confirmação de cadastro.

**Fluxos Alternativos:**
- 2a. Dados obrigatórios ausentes: sistema retorna erro 400.
- 3a. Documento ou e-mail já cadastrado: sistema retorna erro 409.
- 3b. Formato inválido: sistema retorna erro 400.

**Regras de Negócio:**
- Apenas hóspedes podem usar este fluxo.
- Não é permitido auto-cadastro com e-mail ou documento já cadastrado.
- Senha nunca é retornada nem armazenada em texto puro.
- Evento de criação é publicado para integração com outros serviços.

</details>

<details>
<summary><b>UC02 — Cadastro de Hóspede por Admin/Receptionist</b></summary>

**Ator Primário:** Receptionist/Admin

**Fluxo Principal:**
1. Admin/Receptionist acessa endpoint `/users` (POST) autenticado.
2. Informa dados do hóspede.
3. Sistema valida, cria conta e publica evento `user.created`.
4. Recebe confirmação.

**Fluxos Alternativos:**
- 2a. Dados inválidos: sistema retorna erro 400.
- 3a. Documento já cadastrado: sistema retorna erro 409.

**Regras de Negócio:**
- JWT obrigatório para endpoints protegidos.
- Senha armazenada com hash.

</details>

<details>
<summary><b>UC04 — Gerenciamento de Quartos</b></summary>

**Ator Primário:** Admin/Receptionist

**Fluxo Principal:**
1. Acessa `/rooms` autenticado.
2. Cria, edita ou remove quartos.
3. Sistema valida:
  - Número único por quarto.
  - Preço positivo.
  - Tipo válido (RoomFactory).
4. Confirmação.

**Fluxos Alternativos:**
- 2a. Remover quarto ocupado: erro 400.
- 2b. Número duplicado: erro 400.
- 2c. Preço ≤ 0: erro 400.

**Regras de Negócio:**
- Apenas admin/receptionist gerenciam quartos (JWT).
- Integridade de quartos ocupados preservada.
- Factory Pattern para criação de instâncias.

</details>

<details>
<summary><b>UC05 — Reservas</b></summary>

**Ator Primário:** Receptionist/Admin

**Fluxo Principal:**
1. Acessa `/reservations` autenticado.
2. Informa dados (hóspede, quarto, datas).
3. Sistema valida:
  - Campos obrigatórios e tipos.
  - Datas válidas (checkIn < checkOut).
  - Disponibilidade do quarto (sem overbooking).
  - guestId pode ser diferente de userId (reserva para terceiros).
4. Confirmação.

**Fluxos Alternativos:**
- 3a. Quarto indisponível: erro 400.
- 2a. Dados inválidos: erro 400.
- 5a. Cancelamento após check-in/out: erro 400.
- 5b. Usuário comum tentando criar/cancelar: erro 403.

**Regras de Negócio:**
- Apenas receptionist/admin criam/cancelam/alteram (JWT).
- Sem overbooking.
- Cancelamento só antes do check-in.
- Não cancelar reserva finalizada.
- guestId ≠ userId permitido.
- Eventos publicados.

</details>

<details>
<summary><b>UC06 — Pagamento de Reserva</b></summary>

**Ator Primário:** Receptionist/Admin

**Fluxo Principal:**
1. Acessa `/payments` autenticado.
2. Informa reserva e dados do pagamento.
3. Sistema valida:
  - Reserva existe e está confirmada.
  - Valor positivo.
  - Método aceito (cartao, pix, dinheiro).
  - Não pode pagar reserva já paga.
4. Aplica Strategy de descontos.
5. Publica evento.
6. Confirmação.

**Fluxos Alternativos:**
- 2a. Pagamento duplicado: erro 400.
- 2b. Reserva não confirmada: rejeita.
- 2c. Valor inválido: erro 400.
- 2d. Método inválido: erro 400.

**Regras de Negócio:**
- Só reservas confirmadas podem ser pagas.
- Apenas um pagamento por reserva.
- Strategy Pattern para descontos.
- Integração com gateway pode ser simulada.
- Eventos publicados.

</details>

<details>
<summary><b>UC07 — Check-in e Check-out</b></summary>

**Ator Primário:** Receptionist/Admin

**Fluxo Principal:**
1. Acessa `/reservations/checkin` ou `/reservations/checkout` autenticado.
2. Informa reserva.
3. Validações:
  - Check-in somente se reserva paga.
  - Check-out somente após check-in.
  - Não operar em reserva cancelada/finalizada.
4. Publica eventos.
5. Confirmação.

**Fluxos Alternativos:**
- 2a. Check-in sem pagamento: erro 400.
- 2b. Check-out sem check-in: erro 400.
- 2c. Usuário comum tentando operar: erro 403.

**Regras de Negócio:**
- Check-in apenas para reservas pagas.
- Check-out após check-in.
- Só receptionist/admin operam (JWT).
- Eventos publicados.

</details>

<details>
<summary><b>UC08 — Relatórios e Auditoria</b></summary>

**Ator Primário:** Admin/Receptionist

**Fluxo Principal:**
1. Acessa `/reports` autenticado.
2. Solicita relatório de reservas, pagamentos, ocupação ou faturamento.
3. Sistema gera relatório filtrado (período, status, etc.).
4. Recebe relatório.

**Fluxos Alternativos:**
- 2a. Usuário comum tentando acessar: erro 403.
- 2b. Parâmetros inválidos: erro 400.

**Regras de Negócio:**
- Apenas admin/receptionist acessam (JWT).
- Faturamento considera apenas reservas pagas e finalizadas.

</details>

## ✅ Boas práticas e decisões

- Roles padronizadas em EN: admin, receptionist, guest (não traduzir no payload)
- Mensagens e erros em pt-BR nos endpoints
- Sem segredos em Dockerfiles; segredos via variáveis de ambiente
- .gitignore/.dockerignore reforçados; não commitar `.env.local` nem pastas de cobertura
- Health checks HTTP em todos os serviços; `/health` inclui status do Mongo e origem dos segredos em não-prod
- Persistência real no MongoDB (user e room) via Mongoose; em DEV requer Atlas

## 🩺 Health e observabilidade

- GET `/health` em cada serviço retorna JSON com status, uptime e (em dev) origem das variáveis de segredo.
- RabbitMQ console: http://localhost:15672 (guest/guest).

## 🛠️ Solução de problemas (FAQ rápido)

- Erro de conexão com Mongo: verifique `MONGODB_URI` no `.env.local` (Atlas) e liberação de IPs no cluster.
- 401/403 em rotas protegidas: confira `Authorization: Bearer <token>` e a role do usuário.
- Porta em uso: ajuste as portas no `docker-compose.yml` ou pare processos locais.
- RabbitMQ indisponível: aguarde o health check ficar verde; veja logs do serviço.

## 🤝 Contribuição

Contribuições são bem-vindas! Abra issues ou pull requests. Antes de enviar, rode os testes do serviço impactado.
