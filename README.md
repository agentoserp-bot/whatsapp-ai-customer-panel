# 🤖 WhatsApp AI Panel - Painel de Atendimento Inteligente

Um painel completo de atendimento via WhatsApp com IA treinável, integração com Supabase e interface moderna em React.

## 🌐 Demo Online

**🔗 Aplicação Live:** [https://whatsapp-ai-customer-panel.vercel.app](https://whatsapp-ai-customer-panel.vercel.app)

*Versão de demonstração hospedada na Vercel com todas as funcionalidades ativas.*

## ✨ Funcionalidades

### 🔗 Integração com WhatsApp
- ✅ Conexão via QR Code usando `whatsapp-web.js`
- ✅ Múltiplas sessões simultâneas
- ✅ Persistência de sessões
- ✅ Recebimento e envio de mensagens em tempo real

### 🤖 Agente de IA Treinável
- ✅ Integração com OpenAI GPT-3.5-turbo
- ✅ Sistema de treinamento personalizado
- ✅ Respostas baseadas em dados do banco + IA
- ✅ Arquitetura flexível para trocar provedores de IA

### 🗄️ Banco de Dados (Supabase)
- ✅ Autenticação de usuários
- ✅ Armazenamento de dados de treinamento
- ✅ Histórico completo de conversas
- ✅ Perfis de usuários personalizáveis

### 🎨 Interface Moderna
- ✅ React + Vite + TailwindCSS
- ✅ Design responsivo e intuitivo
- ✅ Cores em tons de verde (sem parecer ERP)
- ✅ Componentes reutilizáveis

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express**
- **Socket.IO** para comunicação em tempo real
- **whatsapp-web.js** para integração WhatsApp
- **Supabase** como backend-as-a-service
- **OpenAI API** para inteligência artificial

### Frontend
- **React 18** com hooks modernos
- **Vite** para build rápido
- **TailwindCSS** para estilização
- **React Router** para navegação
- **Socket.IO Client** para WebSocket

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Chave da API OpenAI
- Número de WhatsApp para testes

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/agentoserp-bot/whatsapp-ai-customer-panel.git
cd whatsapp-ai-customer-panel
```

### 2. Instale as dependências
```bash
npm run install:all
```

### 3. Configure as variáveis de ambiente

#### Backend (server/.env)
```env
# Configurações do Servidor
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase

# OpenAI
OPENAI_API_KEY=sua_chave_api_openai

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro

# WhatsApp
WHATSAPP_SESSION_PATH=/tmp/sessions

# Evolution API (Opcional)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_WEBHOOK_SECRET=
```

#### Frontend (client/.env)
```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# API
VITE_API_URL=/api
```

### 4. Execute o projeto

#### Desenvolvimento
```bash
npm run dev
```

#### Produção
```bash
npm run build
npm start
```

## 🚀 Deploy na Vercel

### Deploy Automático
1. Conecte este repositório à sua conta Vercel
2. Configure as variáveis de ambiente no dashboard da Vercel
3. O deploy será automático a cada push

### Deploy Manual
```bash
npm install -g vercel
vercel --prod
```

## 📁 Estrutura do Projeto

```
whatsapp-ai-customer-panel/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # Contextos React
│   │   ├── pages/          # Páginas da aplicação
│   │   └── services/       # Serviços e APIs
│   ├── public/             # Arquivos estáticos
│   └── dist/               # Build de produção
├── server/                 # Backend Node.js
│   ├── routes/             # Rotas da API
│   ├── services/           # Lógica de negócio
│   ├── middleware/         # Middlewares
│   └── api/                # Função serverless
├── deploy/                 # Configurações de deploy
└── docs/                   # Documentação
```

## 🔧 Configuração do Banco

Execute o script SQL incluído no projeto:

```bash
# Execute no Supabase SQL Editor
cat supabase-setup.sql
```

## 📱 Como Usar

### 1. Primeiro Acesso
- Acesse a aplicação
- Crie uma conta ou faça login
- Configure seu perfil

### 2. Conectar WhatsApp
- Vá para a seção "WhatsApp"
- Clique em "Nova Sessão"
- Escaneie o QR Code
- Aguarde a conexão

### 3. Treinar a IA
- Acesse "Treinamento"
- Adicione perguntas e respostas
- Configure categorias
- A IA utilizará os dados para responder

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- 📧 Email: support@zapkoder.com
- 📖 Documentação: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/agentoserp-bot/whatsapp-ai-customer-panel/issues)

---

**🎉 WhatsApp AI Panel - Transformando atendimento com inteligência artificial!**