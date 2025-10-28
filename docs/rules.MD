# Desafio Técnico: Microsserviços em um Ambiente Bancário Inovador

Durante essa etapa, queremos observar como você estrutura soluções, organiza prioridades e resolve problemas de forma autônoma. É a sua chance de mostrar como você pensa e constrói!

## 📌 Organização e Gerenciamento

Você tem total liberdade para organizar seu tempo e estrutura de trabalho. Queremos entender como você gerencia suas próprias atividades, define prioridades e se comunica de forma clara, de forma assíncrona através de documentações.

## 📦 Entregáveis

### Relatório de Progresso

- Link da plataforma de gestão de atividades utilizada para criar e acompanhar backlog
- Como organizou suas demandas e atividades
- Como priorizou as entregas
- Quais foram as principais dificuldades enfrentadas e como lidou com elas
- O que faria diferente com mais tempo ou em um contexto real de projeto

### Entregáveis Técnicos

- Garantir que foi solicitado no escopo do desafio

### ⚡ Essencial: Fluxo de Git

Utilize Git para versionamento de código. Faça commits descritivos; crie uma branch para cada feature e abra um Pull Request para a branch principal ao finalizar (develop ou equivalente).

Isso é importante para organização de fluxo de trabalho e entendimento do histórico.

## 🗓 Prazo e Entrega

- **Prazo**: Até 26/10/2025 às 23:59 (4 dias corridos a partir do recebimento do desafio)
- **Entrega**: Enviar a pasta com o projeto completo como anexo, em formato zip, via e-mail para `processoseletivo@loomi.com.br`

## 💡 Processo Seletivo - Briefing da Solução

### Contexto

Você faz parte de uma equipe responsável por desenvolver um sistema bancário inovador, onde a modularidade e a comunicação eficiente entre microsserviços são cruciais.

**O objetivo é criar dois microsserviços distintos:**

- Um para gerenciar transferências entre pessoas
- Outro para gerenciar detalhes de clientes, incluindo dados bancários

### Comunicação Eficiente

Os microsserviços têm a flexibilidade de se comunicar entre si, caso necessário. Utilize esta capacidade para otimizar o sistema, garantindo que a troca de informações seja eficiente e desacoplada.

## 🛠 Especificações Técnicas

### Arquitetura

- **Clean Architecture**: Implementação baseada nos princípios de Clean Architecture para garantir separação de responsabilidades, testabilidade e manutenibilidade
- **Padronização**: Estrutura e nomenclatura consistentes entre todos os microsserviços
- **Modularidade**: Cada microsserviço deve ser independente e seguir os mesmos padrões arquiteturais

### Stack Tecnológica

- **Linguagem**: TypeScript para tipagem estática e melhor experiência de desenvolvimento
- **Runtime**: Node.js 22 (versão LTS mais recente)
- **ORM**: Prisma (recomendado) ou TypeORM para abstração e gerenciamento do banco de dados
- **Banco de Dados**: PostgreSQL como banco principal, Redis para cache

### Estrutura de Projeto

Cada microsserviço deve seguir a seguinte estrutura baseada em Clean Architecture:

```
src/
├── domain/           # Entidades e regras de negócio
├── application/      # Casos de uso e interfaces
├── infrastructure/   # Implementações externas (DB, APIs)
├── presentation/     # Controllers e rotas
├── shared/          # Utilitários compartilhados
└── tests/           # Testes unitários e integração
```

### Padrões de Nomenclatura

- **Arquivos**: kebab-case (ex: `user-service.ts`)
- **Classes**: PascalCase (ex: `UserService`)
- **Métodos/Variáveis**: camelCase (ex: `getUserById`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase com prefixo "I" (ex: `IUserRepository`)

## 🏗 Microsserviço de Transações

### Banco de Dados

- Escolher um banco de dados relacional (PostgreSQL recomendado)

### Endpoints Mínimos

#### `POST /api/transactions`

Inicia uma nova transferência.

**Parâmetros:**
- `senderUserId`
- `receiverUserId`
- `amount`
- `description`

**Resposta:** Status da transferência

#### `GET /api/transactions/{transactionId}`

Detalhes de uma transferência específica.

**Resposta:** Detalhes da transferência

#### `GET /api/transactions/user/{userId}`

Lista de transferências de um usuário específico.

**Resposta:** Lista de transferências

### Considerações Adicionais

- Implementar mecanismos de segurança (autenticação e autorização)
- O formato dos endpoints mínimos não é obrigatório
- É encorajado implementar endpoints além dos mínimos sugeridos

## 👥 Microsserviço de Clientes

### Banco de Dados

- **Relacional:** PostgreSQL (ou similar)
- **Não Relacional:** Redis para cache de chamadas que não mudam periodicamente

### Endpoints Mínimos

#### `GET /api/users/{userId}`

Detalhes do cliente.

**Resposta:** Informações do cliente, incluindo dados bancários (agência e conta corrente)

#### `PATCH /api/users/{userId}`

Atualização parcial de dados do cliente.

**Parâmetros:** Subconjunto de `{name, email, address, bankingDetails}`

**Resposta:** Status da atualização

#### `PATCH /api/users/{userId}/profile-picture`

Atualização parcial da foto de perfil.

**Parâmetros:** `{profilePicture}`

**Resposta:** Status da atualização

### Dados Bancários

Os dados bancários (agência e conta corrente) podem ser incluídos no objeto `bankingDetails` no modelo do usuário.

### Considerações Adicionais

- O formato dos endpoints mínimos não é obrigatório
- Estes são apenas exemplos do mínimo esperado
- O diferencial será adicionado pela sua criatividade 😉

## 📁 Template dos Microsserviços

Antes de iniciar o desenvolvimento, é crucial estabelecer uma estrutura de template que promova consistência, boas práticas e facilidade de manutenção.

### Diretrizes do Template

1. **Estrutura de Pastas**
   - Separação clara entre fontes, testes e recursos auxiliares
   - Pastas específicas para modelos, controladores, serviços, configurações e testes

2. **Padronização de Nomenclatura**
   - Uso consistente de nomes significativos para classes, métodos e arquivos
   - Convenção para endpoints seguindo as melhores práticas de RESTful

3. **Logging e Monitoramento**
   - Implementação de logs estruturados para rastreamento de eventos
   - Integração com ferramentas de monitoramento para métricas e alertas

4. **Testes Unitários e Integração**
   - Estrutura dedicada para testes unitários e de integração
   - Utilização de bibliotecas e frameworks para facilitar a criação e execução de testes

5. **Gerenciamento de Dependências**
   - Utilização de gerenciadores de pacotes para facilitar a gestão de dependências
   - Versionamento explícito de dependências para evitar surpresas durante atualizações

6. **Segurança**
   - Implementação de práticas recomendadas de segurança
   - Incluindo validação de entrada, proteção contra ataques comuns e controle de acesso

7. **Dockerização**
   - Configuração de Dockerfiles para a criação de imagens consistentes
   - Utilização de Docker Compose para orquestração de microsserviços em ambiente de desenvolvimento

## 🔗 Microsserviços Abstratos

### Interfaces com outros microsserviços

- Crie contratos com microsserviços hipotéticos, sem implementação necessária
- Apenas interfaces para simular a comunicação entre ambientes distribuídos

### Simulação de chamadas

**Caso de uso hipotético:** Dentro do microsserviço de transferências, um possível cenário envolve a solicitação de uma chamada ao microsserviço de notificações criar na base, uma vez que uma transação é concluída com sucesso.

## 📨 Comunicação entre Microsserviços

### Broker de Mensageria (Kafka ou RabbitMQ)

Os microsserviços devem se comunicar entre si, utilizando o broker de mensageria para notificações sobre a atualização dos dados bancários do usuário, garantindo desacoplamento e eficiência na comunicação.

### API Gateway (Opcional)

Recomendamos a criação de uma API Gateway para centralização das chamadas para os serviços, mas fica opcional a implementação de acordo com sua criatividade.

## 🤖 Uso de Ferramentas de IA

O uso consciente e estratégico de ferramentas de IA é incentivado para potencializar o desenvolvimento, sem substituir a autoria e revisão humanas.

### Ferramentas Recomendadas

- **Cursor:** Editor de código com integração de IA, permitindo edição por linguagem natural, sugestões contextuais e refatoração inteligente
- **ChatGPT (OpenAI):** Assistente versátil para geração de código, esclarecimento de dúvidas e brainstorming técnico
- **Claude (Anthropic):** Focado em segurança e alinhamento, útil para revisões e explicações detalhadas
- **Gemini (Google):** Modelo multimodal com integração ao ecossistema Google

### Diretrizes de Uso

- **Objetividade nos Prompts:** Formule solicitações claras e específicas para obter respostas relevantes das ferramentas de IA
- **Revisão Humana:** Todo código gerado por IA deve ser cuidadosamente revisado e ajustado conforme necessário
- **Documentação:** No README do projeto, inclua uma seção detalhando:
  - Quais ferramentas de IA foram utilizadas
  - Exemplos de prompts e resultados obtidos
  - Decisões tomadas com base nas sugestões da IA
- **Ética e Autenticidade:** Utilize a IA como suporte, mantendo a autoria e responsabilidade pelo código desenvolvido

## 📊 Pontos Avaliados

Serão observados os seguintes aspectos sobre o desenvolvimento do desafio:

### Aspectos Técnicos

- Arquitetura do projeto e boas práticas de código (SOLID, KISS, DRY, YAGNI, Clean Code, ESLint)
- Desenvolvimento de API seguindo a arquitetura REST
- Conhecimentos sobre serviços de mensageria
- Criação e gerenciamento de banco de dados
- Implementação de testes
- Uso de Docker/Docker Compose

### Arquitetura e Design

- Fluxograma da comunicação entre os serviços
- Leitura e modelagem de dados
- Template e estrutura dos microsserviços
- Comunicação entre microsserviços

### Gestão e Comunicação

- Comunicação e participação ativa no processo
- Autogerenciamento e qualidade da entrega (prazos, prioridades, comunicação)
- Organização e priorização das atividades
- Uso do GitHub e Gitflow

### Uso de Ferramentas de IA

- Documentação do uso de IA no projeto
- Qualidade das implementações desenvolvidas com auxílio de IA

### Deploy e Infraestrutura

- Processo deploy da API na AWS (ssh, EC2, security group)
- Documentação da API com especificação OpenAPI (recomendação: Swagger)

## 🎯 Considerações Finais

- É incentivado a implementação de boas práticas de segurança
- Não se limite aos exemplos fornecidos, a criatividade e a extensão dos recursos serão valorizadas
- Demonstre habilidades em dockerização dos serviços e deploy na AWS
- Avalie a qualidade do código, a documentação e a capacidade de resolução de problemas durante a implementação

Este desafio visa avaliar não apenas as habilidades técnicas, mas também a capacidade de design, inovação e resolução de problemas em um contexto do mundo real.
