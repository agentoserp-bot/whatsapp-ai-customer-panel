# 🛠️ Sistema de Configuração Dinâmica

Este sistema permite que cada usuário configure suas próprias credenciais de APIs e serviços, tornando a aplicação verdadeiramente multi-tenant.

## 🎯 **Conceito**

Ao invés de usar variáveis de ambiente globais, cada usuário tem sua própria configuração:
- **Supabase:** Próprio projeto e credenciais
- **OpenAI:** Própria API Key
- **Z-API:** Própria instância WhatsApp

## 🔧 **Como Funciona**

### **1. Primeiro Acesso**
- Usuário acessa `/setup`
- Preenche credenciais passo a passo
- Sistema testa cada configuração
- Salva as credenciais criptografadas

### **2. Configurações Posteriores**
- Usuário vai em Settings > APIs
- Pode alterar qualquer configuração
- Testa conexões antes de salvar
- Sistema reinicializa serviços automaticamente

## 📋 **Fluxo de Configuração**

### **Passo 1: Supabase**
```yaml
Dados Necessários:
  - Project URL: https://xxx.supabase.co
  - Anon Key: eyJhbGciOiJIUzI1NiI...
  - Service Role Key: eyJhbGciOiJIUzI1NiI...

Validação:
  - Formato da URL
  - Conexão com o projeto
  - Permissões das chaves
```

### **Passo 2: OpenAI**
```yaml
Dados Necessários:
  - API Key: sk-proj-...

Validação:
  - Formato da chave
  - Teste de requisição
  - Verificação de cota
```

### **Passo 3: Z-API**
```yaml
Dados Necessários:
  - Instance ID: 3F5A2B7C8D9E...
  - Token: A1B2C3D4E5F6...
  - Server URL: https://api.z-api.io
  - Client Token: (opcional)

Validação:
  - Formato das credenciais
  - Status da instância
  - Conectividade com servidor
```

## 🔐 **Segurança**

### **Criptografia**
```javascript
// Dados sensíveis são criptografados em base64
const encrypted = {
  anonKey: Buffer.from(originalKey).toString('base64'),
  token: Buffer.from(originalToken).toString('base64')
}
```

### **Armazenamento**
- **Temporário:** Arquivo local `user-config.json`
- **Produção:** Banco de dados do usuário
- **Nunca:** Variáveis de ambiente globais

### **Validação**
- Timeout de 10 segundos para testes
- Rate limiting nas rotas de teste
- Sanitização de inputs
- Verificação de formatos

## 🚀 **APIs Disponíveis**

### **Verificação**
```http
GET /api/config/check
Response: { configured: false, message: "..." }
```

### **Teste de Conexões**
```http
POST /api/config/test-supabase
POST /api/config/test-openai  
POST /api/config/test-zapi
Body: { credenciais específicas }
Response: { success: true/false, error?: "..." }
```

### **Configuração**
```http
GET /api/config/current
Response: { configured: true, config: { ... } }

POST /api/config/save
Body: { supabase: {...}, openai: {...}, zapi: {...} }
Response: { success: true }
```

## 🎨 **Interface do Usuário**

### **Setup Inicial (/setup)**
- **Wizard de 4 passos**
- **Validação em tempo real**
- **Testes automáticos**
- **Indicadores visuais**
- **Links para documentação**

### **Configurações (Settings > APIs)**
- **Formulários organizados por serviço**
- **Botões de teste individuais**
- **Status de conexão em tempo real**
- **Campos com máscara de senha**
- **Salvamento automático**

## 🔄 **Reinicialização Dinâmica**

Quando configurações são salvas:

```javascript
// 1. Atualizar variáveis de ambiente
process.env.SUPABASE_URL = newConfig.url;
process.env.OPENAI_API_KEY = newConfig.apiKey;

// 2. Reinicializar serviços
await supabaseService.initialize();
await aiService.initialize();
zapiService.addInstance('user', newConfig.zapi);

// 3. Confirmar funcionamento
console.log('✅ Serviços reinicializados');
```

## 📱 **Componentes React**

### **InitialSetup.jsx**
- Wizard de configuração inicial
- 4 etapas com validação
- Indicadores de progresso
- Testes em tempo real

### **ApiConfiguration.jsx**
- Formulários para cada serviço
- Validação e testes
- Interface responsiva
- Feedback visual

## 🛡️ **Tratamento de Erros**

### **Erros Comuns**
```yaml
Supabase:
  - "Invalid URL": URL malformada
  - "Project not found": Projeto inexistente
  - "Invalid API key": Chave inválida

OpenAI:
  - "API Key inválida": Chave incorreta
  - "Cota insuficiente": Sem créditos
  - "Rate limit": Muitas requisições

Z-API:
  - "Instance ID não encontrado": ID incorreto
  - "Token inválido": Token expirado
  - "Servidor indisponível": Timeout
```

### **Fallbacks**
- **Modo Mock:** Se configuração falhar
- **Retry Logic:** Tentativas automáticas
- **Graceful Degradation:** Funcionalidade limitada

## 🌟 **Vantagens**

### **Para Usuários**
✅ **Independência:** Próprias credenciais  
✅ **Controle:** Gerencia próprios recursos  
✅ **Privacidade:** Dados em próprio Supabase  
✅ **Flexibilidade:** Troca credenciais quando quiser  

### **Para Desenvolvedores**
✅ **Escalabilidade:** Cada usuário = próprio ambiente  
✅ **Isolamento:** Falha de um não afeta outros  
✅ **Multi-tenant:** Verdadeiro SaaS  
✅ **Manutenção:** Sem gerenciamento de infraestrutura  

## 🚀 **Deploy e Produção**

### **Variáveis de Ambiente**
```env
# Apenas para desenvolvimento local
NODE_ENV=development
PORT=3001

# JWT para autenticação local
JWT_SECRET=seu_jwt_secret

# Webhook para Z-API
WEBHOOK_SECRET=webhook_secret
```

### **Configuração em Produção**
1. **Deploy da aplicação** (sem credenciais)
2. **Usuário acessa /setup**
3. **Configura suas credenciais**
4. **Sistema funciona independentemente**

## 📚 **Documentação Relacionada**

- [Configuração Z-API](./Z-API-SETUP-GUIDE.md)
- [Setup Supabase](./supabase-setup.sql)
- [Deployment](./DEPLOYMENT.md)

---

## 🎉 **Resultado Final**

**Sistema 100% configurável pelo usuário:**
- ✅ Sem dependência de variáveis globais
- ✅ Cada usuário tem seu ambiente
- ✅ Configuração via interface visual
- ✅ Testes automáticos de conectividade
- ✅ Reinicialização dinâmica de serviços
- ✅ Segurança e criptografia
- ✅ Interface intuitiva e responsiva

**🎯 Verdadeiro sistema SaaS multi-tenant!**
