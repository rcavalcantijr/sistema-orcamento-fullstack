# Sistema de Orçamento / Quotation System

## 🇧🇷 Português

Um sistema full-stack completo para criação e gerenciamento de orçamentos comerciais, desenvolvido com React, Node.js e PostgreSQL.

### Funcionalidades Implementadas

- **Autenticação e Autorização:** Login seguro com JWT e diferenciação de permissões entre `Admin` e `Usuário`.
- **Gerenciamento Completo (CRUD):**
    - Clientes (com busca e validação por CPF/CNPJ)
    - Produtos/Serviços (com busca e validação por descrição)
    - Cláusulas Contratuais (com busca por título)
    - Usuários (acessível apenas para Admins)
- **Criação de Orçamentos:**
    - Formulário dinâmico para adicionar múltiplos itens e cláusulas.
    - Cálculo de desconto percentual por item.
    - Edição de itens já adicionados à lista.
    - Campos para contato específico do orçamento (nome e e-mail).
- **Gerenciamento de Orçamentos:**
    - Listagem com busca por número do orçamento ou nome do cliente.
    - Edição de orçamentos salvos.
    - Controle de revisão automático a cada edição.
    - Alteração de status (Rascunho, Aprovado, Cancelado).
- **Modelos de Orçamento:**
    - Crie modelos pré-configurados com itens e cláusulas.
    - Use um modelo para iniciar rapidamente um novo orçamento.
- **Impressão Profissional:**
    - Geração de um documento em formato A4, pronto para impressão ou para salvar como PDF.
    - Layout profissional com paginação, cabeçalho e rodapé.
- **Usabilidade:**
    - Máscaras de formatação automática para CPF/CNPJ, Telefone e NCM.
    - Preenchimento automático de endereço via consulta de CEP.

### Tecnologias Utilizadas

- **Frontend:** React.js, Axios
- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JSON Web Tokens (JWT), bcrypt.js

### Pré-requisitos

- Node.js (v16 ou superior)
- npm (geralmente instalado com o Node.js)
- Uma instância do PostgreSQL rodando.

### Como Executar o Projeto

**1. Clone o Repositório**

git clone <URL_DO_SEU_REPOSITORIO>
cd <NOME_DA_PASTA_DO_PROJETO>


**2. Configure o Backend**

cd sistema-orcamento-backend
npm install

**Crie um arquivo .env na pasta sistema-orcamento-backend e adicione as seguintes variáveis:**
DB_USER=seu_usuario_postgres
DB_HOST=localhost
DB_DATABASE=sistema_orcamento
DB_PASSWORD=sua_senha_postgres
DB_PORT=5432
JWT_SECRET=seu_segredo_jwt_super_secreto

**Inicie o servidor backend:**
node index.js

**3. Configure o Frontend**
Em um novo terminal
cd sistema-orcamento-frontend
npm install

**Inicie a aplicação React:**
npm start

A aplicação estará rodando em http://localhost:3000



# English
A complete full-stack system for creating and managing commercial budgets, developed with React, Node.js, and PostgreSQL.

## Implemented Features
- **Authentication and Authorization:** Secure login with JWT and permission differentiation between Admin and User

- **Complete Management (CRUD):**
    - Clients (with search and validation by CPF/CNPJ)
    - Products/Services (with search and validation by description)
    - Contractual Clauses (with search by title)
    - Users (accessible only to Admins)

- **Budget Creation:**
    - Dynamic form to add multiple items and clauses.
    - Percentage discount calculation per item.
    - Editing items already added to the list.
    - Fields for specific budget contact (name and email).

- **Budget Management:**
    - Listing with search by budget number or client name.
    - Editing saved budgets.
    - Automatic revision control on each edit.
    - Status change (Draft, Approved, Canceled).

- **Budget Templates:**
    - Create pre-configured templates with items and clauses.
    - Use a template to quickly start a new budget.

- **Professional Printing:**
    - Generation of an A4-format document, ready for printing or saving as PDF.
    - Professional layout with pagination, header, and footer.

- **Usability:**
    - Automatic formatting masks for CPF/CNPJ, Phone, and NCM.
    - Auto-complete address by ZIP code (CEP) lookup.

## Technologies Used
    - Frontend: React.js, Axios
    - Backend: Node.js, Express.js
    - Database: PostgreSQL
    - Authentication: JSON Web Tokens (JWT), bcrypt.js

## Prerequisites
    - Node.js (v16 or higher)
    - npm (usually comes with Node.js)
    - A running PostgreSQL instance

## How to Run the Project
**1. Clone the Repository**

git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER_NAME>

**2. Set Up the Backend**

cd sistema-orcamento-backend
npm install

**Create a .env file inside the sistema-orcamento-backend folder and add the following variables:**

DB_USER=your_postgres_user
DB_HOST=localhost
DB_DATABASE=sistema_orcamento
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=your_super_secret_jwt_key

**Start the backend server:**
node index.js

**3. Set Up the Frontend**
In a new terminal:
cd sistema-orcamento-frontend
npm install

**Start the React application:**
npm start

The application will be running at http://localhost:3000
