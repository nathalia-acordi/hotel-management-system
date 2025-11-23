
# 🏨 Hotel Management System

Este repositório contém um conjunto de microsserviços orquestrados por um API Gateway. Para uma visão detalhada da arquitetura, comunicação, princípios SOLID, padrões de projeto e estratégia de testes, consulte:

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

  <img src="https://img.shields.io/badge/Tests-Jest%20%2B%20Supertest-4caf50?style=for-the-badge&labelColor=222&logo=jest&logoColor=white" alt="Jest + Supertest"/>
  <img src="https://img.shields.io/badge/Messaging-RabbitMQ-ff6600?style=for-the-badge&labelColor=222&logo=rabbitmq&logoColor=white" alt="RabbitMQ"/>

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
- Testes unitários e de integração por serviço; cobertura em `docs/arquitetura.md`

## Estrutura do Projeto

```text
hotel-management-system/
├── services/           # Microsserviços (user, auth, room, reservation, payment, gateway)
│   └── .../tests/      # Cada serviço contém seus próprios testes (unit/integration)
├── docker-compose.yml  # Orquestração dos serviços e mensageria (sem Mongo container)
└── README.md           # Este guia
```

## Executando (resumo)

PowerShell (Windows):

```powershell
docker compose up -d --build
```

Testes no gateway dentro do container:

```powershell
docker compose exec gateway npm test -- --testPathPattern=gatewayHealth.test.js
docker compose exec gateway npm test
```

## Rodando Localmente (sem Docker)

Quando quiser focar em um único serviço localmente (PowerShell):

```powershell
# 1) Defina variáveis locais (ou crie .env.local na raiz)
$env:MONGODB_URI = "mongodb+srv://<usuario>:<senha>@<cluster>/<db>?retryWrites=true&w=majority"
$env:JWT_SECRET = "altere_este_valor_no_seu_ambiente"
$env:RABBITMQ_URL = "amqp://localhost:5672"  # opcional, somente se usar mensageria local

# 2) Suba o serviço desejado
cd services/user; npm install; npm start
```

Observações:
- Em DEV não há container de Mongo; use uma URI do Atlas.
- Para mensageria local, suba um RabbitMQ local ou rode `docker compose up rabbitmq`.
- O API Gateway depende dos demais serviços para responder às rotas proxy.

## 🏗️ Microsserviços

| Microsserviço | Função |
| ------------ | ------ |
| **gateway** | Entrada única; autenticação e proxy para os microsserviços. |
| **user** | Gerencia usuários/hóspedes, cadastro, validações (CPF/RG), perfis e integração com Auth. |
| **reservation** | Controla reservas (datas, disponibilidade), conflitos, cancelamentos; integra com Room/Payment. |
| **room** | Gerencia quartos, tipos e status (livre/ocupado/manutenção), atendendo o Reservation. |
| **payment** | Processa pagamentos, aplica descontos (Strategy), valida status e registra transações. |
| **auth** | Autenticação, geração/validação de JWT, login e integração com User. |

## 🗂️ Status dos Serviços (Docker)

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

## 📈 Diagramas 

### Visão Geral (Arquitetura)

```mermaid
graph LR
  A[Cliente / Postman] -->|HTTP| G[API Gateway]

  subgraph Services
    U[User]
    AU[Auth]
    R[Room]
    RS[Reservation]
    P[Payment]
  end

  G -->|/register, /self-register| U
  G -->|/login| AU
  G -->|/api/users| U
  G -->|/api/rooms| R
  G -->|/api/reservations| RS
  G -->|/api/payments| P

  subgraph Infra
    MQ[(RabbitMQ)]
    DB[(MongoDB)]
  end

  U <-->|CRUD| DB
  R <-->|CRUD| DB
  RS <-->|CRUD| DB

  U -- user.created --> MQ
  AU -- login events --> MQ
  P -- payment.completed --> MQ
  RS -.consumes events.- MQ

  classDef svc fill:#0ea5e9,stroke:#0369a1,color:#fff;
  classDef infra fill:#94a3b8,stroke:#334155,color:#111827;
  class U,AU,R,RS,P svc;
  class MQ,DB infra;
```

### Gateway — Roteamento e Autenticação

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as Gateway
  participant S as Serviço

  Note over G: Rotas públicas: /login, /register, /self-register, /api/payments/health
  Note over G: Rotas protegidas: /api/* (JWT obrigatório)

  C->>G: GET /api/payments/health
  G-->>C: 200 OK (proxy para Payment /health)

  C->>G: POST /login {identifier,password}
  G->>S: Auth /login
  S-->>G: 200 {token}
  G-->>C: 200 {token}

  C->>G: GET /api/rooms (Authorization: Bearer ...)
  G->>G: authenticateJWT + authorizeRoles
  G->>S: proxy para Room
  S-->>G: 200 ...
  G-->>C: 200 ...
```

### Auth — Login e Emissão de JWT

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as Gateway
  participant A as Auth (Interfaces)
  participant AS as AuthService (Application)
  participant UR as UserReader
  participant PH as PasswordHasher
  participant JT as JwtTokenService
  participant MQ as RabbitMQ

  C->>G: POST /login {identifier,password}
  G->>A: /login
  A->>AS: login(identifier, password)
  AS->>UR: findByEmailOrUsername(...)
  UR-->>AS: user
  AS->>PH: compare(password, user.passwordHash)
  PH-->>AS: ok
  AS->>JT: sign(claims)
  JT-->>AS: token
  AS->>MQ: publish login (não bloqueante)
  AS-->>A: {token, user}
  A-->>G: 200 {token}
  G-->>C: 200 {token}
```

### User — Auto Cadastro (Self-Register)

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as Gateway
  participant U as User (Interfaces)
  participant V as Joi Validator
  participant S as UserService (Application)
  participant R as UserRepository (Mongo)
  participant H as PasswordHasher
  participant MQ as RabbitMQ

  C->>G: POST /self-register {username,email,document,phone,password}
  G->>U: /self-register
  U->>V: validate(payload)
  V-->>U: ok
  U->>H: hash(password)
  H-->>U: passwordHash
  U->>S: createUser(...)
  S->>R: save(user)
  R-->>S: userId
  S->>MQ: publish user.created
  U-->>G: 201 Created (sem expor hash)
  G-->>C: 201 Created
```

### Room — Criação de Quarto (Protegido)

```mermaid
sequenceDiagram
  participant C as Cliente (admin/receptionist)
  participant G as Gateway
  participant R as Room (Interfaces)
  participant A as Auth Middleware
  participant S as RoomService (Application)
  participant M as MongoRoomRepository
  participant DB as MongoDB

  C->>G: POST /api/rooms {payload}
  G->>A: authenticateJWT + authorizeRoles
  A-->>G: ok
  G->>R: /rooms
  R->>S: createRoom(payload)
  S->>M: persist(value)
  M->>DB: insertOne
  DB-->>M: _id
  M-->>S: room
  S-->>R: 201 room
  R-->>G: 201 room
  G-->>C: 201 room
```

### Reservation — Health e Consumer de Eventos

```mermaid
sequenceDiagram
  participant RS as Reservation
  participant DB as MongoDB
  participant MQ as RabbitMQ

  Note over RS: /health retorna estado do Mongo e RabbitMQ
  RS->>DB: ping/driver state
  MQ-->>RS: user.created (consumer startUserCreatedConsumer)
  RS->>DB: atualizações relacionadas à reserva (quando aplicável)
```

### Payment — Criação e Descontos (Strategy)

```mermaid
sequenceDiagram
  participant C as Cliente
  participant G as Gateway
  participant P as Payment (Interfaces)
  participant S as PaymentService (Application)
  participant Repo as InMemoryPaymentRepository
  participant Strat as Strategy (pix/cartao/dinheiro)
  participant MQ as RabbitMQ

  C->>G: POST /api/payments {reservationId, amount, method, status}
  G->>P: /payments (JWT ok)
  P->>S: createPayment(data)
  S->>S: validações (campos, duplicidade)
  S->>Repo: add(payment)
  alt status == "pago"
    S->>Strat: calculate(amount)
    Strat-->>S: finalAmount
    S->>MQ: publish payment.completed
  end
  S-->>P: {status:201, body}
  P-->>G: 201
  G-->>C: 201 (payment)
```

## 🔑 Variáveis de ambiente

Crie um arquivo `.env.local` na raiz (baseado em `.env.local.sample`) com:

```ini
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

- Gateway: <http://localhost:3005>
- RabbitMQ UI: <http://localhost:15672> (guest/guest)

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

### Cobertura por Serviço (Windows)

Use os comandos abaixo em cada pasta `services/<nome>`:

```powershell
# auth
cd services/auth; npm install; npm run coverage

# user
cd services/user; npm install; npm run coverage

# room
cd services/room; npm install; npm run coverage

# reservation
cd services/reservation; npm install; node --experimental-vm-modules ./node_modules/jest/bin/jest.js --config=jest.config.mjs --coverage

# payment
cd services/payment; npm install; npm test   # já inclui --coverage no script

# gateway
cd services/gateway; npm install; node --experimental-vm-modules ./node_modules/jest/bin/jest.js --config=jest.config.mjs --coverage
```

- Relatórios são gerados em `services/<nome>/coverage`.
- Números consolidados e instruções detalhadas: veja `docs/arquitetura.md` (seção Testes e Cobertura).

## 🩺 Health e observabilidade

- GET `/health` em cada serviço retorna JSON com status, uptime e (em dev) origem das variáveis de segredo.
- RabbitMQ console: <http://localhost:15672> (guest/guest).

## 🛠️ Solução de problemas (FAQ rápido)

- Erro de conexão com Mongo: verifique `MONGODB_URI` no `.env.local` (Atlas) e liberação de IPs no cluster.
- 401/403 em rotas protegidas: confira `Authorization: Bearer <token>` e a role do usuário.
- Porta em uso: ajuste as portas no `docker-compose.yml` ou pare processos locais.
- RabbitMQ indisponível: aguarde o health check ficar verde; veja logs do serviço.
- `cross-env` não encontrado: rode `npm install` no serviço antes dos testes.
- `mongodb-memory-server` demorando no primeiro teste: é normal (download de binários do Mongo para testes).

## 🤝 Contribuição

Contribuições são bem-vindas! Abra issues ou pull requests. Antes de enviar, rode os testes do serviço impactado.


