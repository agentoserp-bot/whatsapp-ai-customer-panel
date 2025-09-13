# 🚀 Guia de Configuração Z-API

Este guia mostra como configurar sua instância Z-API para usar com o painel WhatsApp AI.

## 📋 Pré-requisitos

1. **Conta Z-API**: Crie uma conta em [Z-API](https://z-api.io)
2. **Instância Ativa**: Tenha uma instância Z-API ativa
3. **Supabase Configurado**: Execute o script `supabase-setup.sql`

## 🔧 Configuração Passo a Passo

### 1. Obter Credenciais Z-API

No painel da Z-API, você precisará de:

- **Instance ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Token**: `xxxxxxxxxxxxxxxxxxxxxxxxx`
- **Server URL**: `https://api.z-api.io`
- **Client Token** (opcional): Para maior segurança

### 2. Configurar no Painel

1. Acesse o painel WhatsApp AI
2. Vá em **Settings > APIs**
3. Na seção **Z-API Configuration**:
   - Cole seu **Instance ID**
   - Cole seu **Token**
   - Coloque a **Server URL**: `https://api.z-api.io`
   - **Client Token** (opcional, mas recomendado)

### 3. Configurar Webhook

**URL do Webhook:** `https://SEU-DOMINIO.com/webhook/zapi`

No painel Z-API:
1. Vá em **Webhooks**
2. Configure a URL: `https://SEU-DOMINIO.com/webhook/zapi`
3. Ative os seguintes eventos:
   - ✅ **Message** (Mensagens recebidas)
   - ✅ **Connected** (Quando conectar)
   - ✅ **Disconnected** (Quando desconectar)
   - ✅ **QR Code** (Para gerar QR Code)

### 4. Testar Configuração

1. No painel, clique em **"Testar Conexão"**
2. Se estiver tudo certo, verá: ✅ **Configuração válida**
3. Clique em **"Gerar QR Code"**
4. Escaneie com seu WhatsApp

## 🔗 URLs Importantes

### Webhooks
- **Principal**: `https://SEU-DOMINIO.com/webhook/zapi`
- **Específico**: `https://SEU-DOMINIO.com/webhook/zapi/{userID}/{token}`

### API Endpoints
- **Status**: `GET /api/zapi/status`
- **QR Code**: `GET /api/zapi/qrcode`
- **Enviar Mensagem**: `POST /api/zapi/send-message`
- **Configuração**: `POST /api/zapi/config`

## 📱 Funcionalidades Disponíveis

### ✅ Funciona Automaticamente
- ✅ Recebimento de mensagens
- ✅ Respostas automáticas da IA
- ✅ Busca nos dados de treinamento
- ✅ Logs de conversas
- ✅ Estatísticas em tempo real
- ✅ Notificações via Socket.IO

### 🎯 Recursos da IA
- ✅ Resposta primeiro dos dados de treinamento
- ✅ Se não encontrar, usa OpenAI
- ✅ Contexto de conversa
- ✅ Personalização por usuário

## 🔒 Segurança

### Criptografia
- ✅ Tokens criptografados no banco
- ✅ HTTPS obrigatório
- ✅ Rate limiting
- ✅ Validação de webhook

### Autenticação
- ✅ JWT tokens
- ✅ Supabase Auth
- ✅ Row Level Security (RLS)

## 🐛 Resolução de Problemas

### ❌ "Configuração inválida"
- Verifique se o Instance ID está correto
- Confirme se o Token não expirou
- Teste a Server URL manualmente

### ❌ "Webhook não funciona"
- Verifique se a URL está acessível
- Confirme se o SSL está ativo
- Teste com `curl` ou Postman

### ❌ "QR Code não aparece"
- Aguarde alguns segundos após configurar
- Tente reiniciar a instância Z-API
- Verifique os logs do servidor

### ❌ "Mensagens não chegam"
- Confirme se o webhook está configurado
- Verifique se os eventos estão ativos
- Veja os logs no painel Z-API

## 📊 Monitoramento

### Logs Disponíveis
- ✅ Mensagens enviadas/recebidas
- ✅ Respostas da IA
- ✅ Erros de conexão
- ✅ Eventos do webhook

### Estatísticas
- ✅ Total de mensagens
- ✅ Mensagens hoje
- ✅ Respostas automáticas
- ✅ Tempo médio de resposta

## 🔄 Backup e Migração

### Exportar Dados
```bash
# Exportar configuração
GET /api/zapi/config

# Exportar logs
GET /api/conversations?export=true
```

### Migração
1. Exporte os dados do usuário antigo
2. Configure nova instância Z-API
3. Importe dados de treinamento
4. Teste a configuração

## 🆘 Suporte

### Documentação
- [Z-API Docs](https://docs.z-api.io)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)

### Contato
- Email: seu-email@exemplo.com
- Telegram: @seu_usuario

---

## 💡 Dicas Pro

1. **Use Client Token**: Maior segurança
2. **Configure Rate Limit**: Evita spam
3. **Monitore Logs**: Identifica problemas
4. **Backup Regular**: Seus dados de treinamento
5. **Teste Webhook**: Sempre após mudanças

---

**✨ Pronto! Sua instância Z-API está configurada e funcionando!**
