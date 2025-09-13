const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.client = null;
    this.adminClient = null;
  }

  async initialize() {
    try {
      // Verificar se as variáveis estão configuradas corretamente
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_URL === 'sua_url_do_supabase' ||
          process.env.SUPABASE_ANON_KEY === 'sua_chave_anonima_do_supabase') {
        
        throw new Error('Configure as credenciais reais do Supabase no arquivo .env');
      }

      // Cliente para operações do usuário
      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Cliente admin para operações privilegiadas
      this.adminClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Verificar conexão
      const { data, error } = await this.client.from('users').select('count').limit(1);
      
      if (error) {
        console.warn('⚠️ Aviso: Tabela users pode não existir ainda:', error.message);
      } else {
        console.log('✅ Conexão com Supabase estabelecida');
      }

      this.mockMode = false;

    } catch (error) {
      console.error('❌ Erro ao inicializar Supabase:', error);
      throw error;
    }
  }

  // Métodos de autenticação
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para dados de treinamento
  async getTrainingData(userId, limit = 100) {
    try {
      const { data, error } = await this.client
        .from('training_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createTrainingData(userId, question, answer, category = 'general') {
    try {
      const { data, error } = await this.client
        .from('training_data')
        .insert({
          user_id: userId,
          question: question.toLowerCase().trim(),
          answer,
          category,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateTrainingData(id, updates) {
    try {
      const { data, error } = await this.client
        .from('training_data')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteTrainingData(id) {
    try {
      const { error } = await this.client
        .from('training_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Buscar resposta no banco
  async findAnswer(question, userId) {
    try {
      const normalizedQuestion = question.toLowerCase().trim();
      
      // Buscar resposta exata primeiro
      let { data, error } = await this.client
        .from('training_data')
        .select('answer, category')
        .eq('user_id', userId)
        .eq('question', normalizedQuestion)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return { success: true, answer: data.answer, source: 'database', category: data.category };
      }

      // Buscar respostas similares (implementar busca fuzzy depois)
      const { data: similarData, error: similarError } = await this.client
        .from('training_data')
        .select('answer, category')
        .eq('user_id', userId)
        .ilike('question', `%${normalizedQuestion.split(' ')[0]}%`)
        .limit(1)
        .single();

      if (similarError && similarError.code !== 'PGRST116') {
        throw similarError;
      }

      if (similarData) {
        return { success: true, answer: similarData.answer, source: 'database_similar', category: similarData.category };
      }

      return { success: true, answer: null, source: 'not_found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para logs de conversas
  async logConversation(userId, phoneNumber, message, response, source = 'ai') {
    try {
      const { data, error } = await this.client
        .from('conversation_logs')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          message_received: message,
          response_sent: response,
          response_source: source,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao salvar log:', error);
      return { success: false, error: error.message };
    }
  }

  async getConversationLogs(userId, limit = 100, offset = 0) {
    try {
      const { data, error } = await this.client
        .from('conversation_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para usuários
  async createUserProfile(userId, profileData) {
    try {
      const { data, error } = await this.client
        .from('users')
        .insert({
          id: userId,
          ...profileData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(userId) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await this.client
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Z-API
  async saveZApiConfig(userId, config) {
    try {
      const crypto = require('crypto');
      const { data, error } = await this.client
        .from('zapi_configs')
        .upsert({
          user_id: userId,
          instance_id: config.instanceId,
          token: config.token, // Já criptografado
          server_url: config.serverUrl,
          client_token: config.clientToken,
          webhook_url: config.webhookUrl,
          is_active: config.isActive,
          webhook_token: crypto.randomBytes(32).toString('hex'),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao salvar config Z-API:', error);
      return { success: false, error: error.message };
    }
  }

  async getZApiConfig(userId) {
    try {
      const { data, error } = await this.client
        .from('zapi_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Descriptografar tokens
        data.token = Buffer.from(data.token, 'base64').toString();
        if (data.client_token) {
          data.client_token = Buffer.from(data.client_token, 'base64').toString();
        }
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateZApiConfig(userId, updates) {
    try {
      const { data, error } = await this.client
        .from('zapi_configs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteZApiConfig(userId) {
    try {
      const { data, error } = await this.client
        .from('zapi_configs')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findUserByInstanceId(instanceId) {
    try {
      const { data, error } = await this.client
        .from('zapi_configs')
        .select('user_id')
        .eq('instance_id', instanceId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logMessage(messageData) {
    try {
      const { data, error } = await this.client
        .from('message_logs')
        .insert({
          user_id: messageData.userId,
          phone: messageData.phone,
          message: messageData.message,
          type: messageData.type,
          message_id: messageData.messageId,
          platform: messageData.platform,
          ai_generated: messageData.aiGenerated || false,
          reply_to: messageData.replyTo,
          timestamp: messageData.timestamp || new Date().toISOString()
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMessageLogs(userId, filters = {}) {
    try {
      let query = this.client
        .from('message_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (filters.phone) {
        query = query.eq('phone', filters.phone);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SupabaseService();