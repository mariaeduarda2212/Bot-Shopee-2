# Bot Afiliado - Integração com WhatsApp

Este projeto é um **bot de integração com o WhatsApp** desenvolvido para automatizar interações e facilitar o envio de links de afiliado.  
Ele conta com um **frontend em React + TypeScript** para interface e um **servidor Node.js** responsável pela conexão com o WhatsApp.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) para build e desenvolvimento rápido
- [TailwindCSS](https://tailwindcss.com/) para estilização
- Estrutura de componentes em **TSX**

### Backend
- [Node.js](https://nodejs.org/) com módulos CommonJS
- Integração com API do **WhatsApp**
- Rotas e serviços em `server/`

---

## 📂 Estrutura do Projeto

```
project/
├── src/                  # Código do frontend (React + TS)
│   ├── components/       # Componentes da aplicação
│   ├── services/         # Serviços e chamadas à API
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Ponto de entrada
│
├── server/               # Código do backend
│   ├── server.cjs        # Servidor Node.js
│   └── whatsapp.cjs      # Conexão com WhatsApp
│
├── public/               # Arquivos estáticos
├── package.json          # Dependências principais
├── tailwind.config.js    # Configuração do Tailwind
├── vite.config.ts        # Configuração do Vite
└── .env                  # Variáveis de ambiente
```

---

## ⚙️ Configuração do Ambiente

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/bot-afiliado-whatsapp.git
cd bot-afiliado-whatsapp/project
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo **.env** na raiz com os seguintes parâmetros (exemplo):

```env
WHATSAPP_SESSION=default
API_URL=http://localhost:3000
```

### 4. Rodar o frontend
```bash
npm run dev
```

### 5. Rodar o backend
Entre na pasta `server/` e execute:
```bash
node server.cjs
```

---

## 📱 Funcionalidades

- Conexão automática com o **WhatsApp**
- Envio de links de **afiliados** direto pelo bot
- Interface web para controle e gerenciamento
- Integração com **Shopee** (pasta `tokens/shopee-sender/`)

---

## 📌 Próximos Passos

- [ ] Adicionar suporte a múltiplas contas de WhatsApp  
- [ ] Melhorar autenticação e segurança com tokens  
- [ ] Criar dashboard com estatísticas de cliques e vendas  

---

## 🛠️ Contribuição

Sinta-se à vontade para abrir **issues** e **pull requests** com melhorias e correções.  

---

## 📄 Licença

Este projeto está sob a licença **MIT**.  
Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
