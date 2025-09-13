-- =====================================================
-- CONFIGURAÇÃO COMPLETA DO SUPABASE PARA WHATSAPP AI
-- =====================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE DADOS DE TREINAMENTO
CREATE TABLE IF NOT EXISTS training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE LOGS DE CONVERSAS
CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  phone_number TEXT NOT NULL,
  message_received TEXT,
  response_sent TEXT,
  response_source TEXT DEFAULT 'ai' CHECK (response_source IN ('database', 'ai', 'fallback')),
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE SESSÕES WHATSAPP
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  status TEXT DEFAULT 'connecting' CHECK (status IN ('connecting', 'connected', 'disconnected', 'error')),
  phone_number TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE ESTATÍSTICAS
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  ai_responses INTEGER DEFAULT 0,
  database_responses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_training_data_user_category ON training_data(user_id, category);
CREATE INDEX IF NOT EXISTS idx_training_data_question_gin ON training_data USING gin(to_tsvector('portuguese', question));
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_date ON conversation_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_phone ON conversation_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user ON whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_stats(user_id, date);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_data_updated_at BEFORE UPDATE ON training_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_stats_updated_at BEFORE UPDATE ON usage_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para usuários
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para dados de treinamento
CREATE POLICY "Users can manage own training data" ON training_data
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para logs de conversas
CREATE POLICY "Users can view own conversation logs" ON conversation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation logs" ON conversation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para sessões WhatsApp
CREATE POLICY "Users can manage own WhatsApp sessions" ON whatsapp_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para estatísticas
CREATE POLICY "Users can view own usage stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage stats" ON usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir usuário admin padrão (substitua o UUID pelo seu usuário)
-- INSERT INTO users (id, full_name, email, role) 
-- VALUES ('SEU_UUID_AQUI', 'Administrador', 'admin@exemplo.com', 'admin');

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'training_data', 'conversation_logs', 'whatsapp_sessions', 'usage_stats')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- NOVAS TABELAS PARA Z-API
-- =====================================================

-- Tabela para configurações Z-API
CREATE TABLE IF NOT EXISTS zapi_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_id VARCHAR(100) NOT NULL,
    token TEXT NOT NULL, -- Criptografado em base64
    server_url VARCHAR(255) NOT NULL,
    client_token TEXT, -- Criptografado em base64 (opcional)
    webhook_url VARCHAR(500),
    webhook_token VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    last_connected TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id),
    UNIQUE(instance_id)
);

-- Tabela para logs de mensagens
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sent', 'received')),
    message_id VARCHAR(100),
    platform VARCHAR(20) DEFAULT 'zapi',
    ai_generated BOOLEAN DEFAULT false,
    reply_to VARCHAR(100), -- ID da mensagem que está sendo respondida
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para estatísticas em tempo real
CREATE TABLE IF NOT EXISTS real_time_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_messages INTEGER DEFAULT 0,
    messages_today INTEGER DEFAULT 0,
    ai_responses INTEGER DEFAULT 0,
    avg_response_time_seconds DECIMAL(10,2) DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Índices para Z-API
CREATE INDEX IF NOT EXISTS idx_zapi_configs_user_id ON zapi_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_zapi_configs_instance_id ON zapi_configs(instance_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_phone ON message_logs(phone);
CREATE INDEX IF NOT EXISTS idx_message_logs_timestamp ON message_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_real_time_stats_user_id ON real_time_stats(user_id);

-- Triggers para updated_at
CREATE TRIGGER update_zapi_configs_updated_at BEFORE UPDATE ON zapi_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE zapi_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_stats ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para zapi_configs
CREATE POLICY "Users can manage own Z-API configs" ON zapi_configs
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para message_logs
CREATE POLICY "Users can view own message logs" ON message_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert message logs" ON message_logs
  FOR INSERT WITH CHECK (true); -- Permitir inserção via webhook

-- Políticas RLS para real_time_stats
CREATE POLICY "Users can view own real time stats" ON real_time_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage real time stats" ON real_time_stats
  FOR ALL WITH CHECK (true); -- Permitir via sistema

-- Verificação final das novas tabelas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('zapi_configs', 'message_logs', 'real_time_stats')
ORDER BY table_name;