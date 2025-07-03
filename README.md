# Projeto2Node 


Aplicação Node.js com autenticação, gerenciamento de sessões e frontend estático.

## 🚀 Funcionalidades

- Cadastro e login de usuários com senha criptografada (bcrypt)
- Sessão persistente com cookies armazenados no MongoDB
- Autenticação via JWT para rotas protegidas
- Upload e exibição de imagens
- Frontend estático com HTML, CSS e JavaScript

## 🛠️ Tecnologias utilizadas

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [express-session](https://www.npmjs.com/package/express-session) + [connect-mongo](https://www.npmjs.com/package/connect-mongo)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [cors](https://www.npmjs.com/package/cors)

## 📦 Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/isabellelays/Projeto2Node.git
   cd Projeto2Node
2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o arquivo `.env`:**
   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```
   MONGODB_URI=mongodb://localhost:27017/projeto2node
   JWT_SECRET=sua_chave_jwt
   SESSION_SECRET=sua_chave_de_sessao
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```
   O servidor rodará em `http://localhost:3000` (ou porta definida no `.env`).

## Rotas principais

- `/` - Página inicial (frontend)
- `/dashboard` - Dashboard (frontend)
- `/auth/register` - Cadastro de usuário (POST)
- `/auth/login` - Login de usuário (POST)
- `/user/profile` - Rota protegida (GET)
- `/session/logout` - Logout (POST)
- `/status` - Status do servidor e banco (GET)
