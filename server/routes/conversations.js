const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');

// Middleware para verificar autenticação
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabaseService.client.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno na autenticação' });
  }
};

// GET /api/conversations - Listar histórico de conversas
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, phoneNumber, source, startDate, endDate, search } = req.query;
    
    // Buscar logs de conversas
    let result = await supabaseService.getConversationLogs(
      req.user.id, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    let data = result.data || [];

    // Filtrar por número de telefone se especificado
    if (phoneNumber) {
      data = data.filter(item => 
        item.phone_number && item.phone_number.includes(phoneNumber)
      );
    }

    // Filtrar por fonte da resposta se especificado
    if (source && source !== 'all') {
      data = data.filter(item => item.response_source === source);
    }

    // Filtrar por período se especificado
    if (startDate || endDate) {
      data = data.filter(item => {
        const itemDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        return itemDate >= start && itemDate <= end;
      });
    }

    // Filtrar por busca se especificado
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(item => 
        (item.message_received && item.message_received.toLowerCase().includes(searchLower)) ||
        (item.response_sent && item.response_sent.toLowerCase().includes(searchLower)) ||
        (item.phone_number && item.phone_number.includes(search))
      );
    }

    // Aplicar paginação
    const total = data.length;
    const paginatedData = data.slice(0, parseInt(limit));

    res.json({
      data: paginatedData,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// GET /api/conversations/stats - Estatísticas das conversas
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Buscar logs de conversas
    const result = await supabaseService.getConversationLogs(req.user.id, 10000, 0);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    let data = result.data || [];

    // Filtrar por período se especificado
    if (startDate || endDate) {
      data = data.filter(item => {
        const itemDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        return itemDate >= start && itemDate <= end;
      });
    }

    // Calcular estatísticas
    const stats = {
      total: data.length,
      uniquePhones: [...new Set(data.map(item => item.phone_number))].length,
      sources: {},
      daily: {},
      hourly: {},
      averageResponseLength: 0,
      totalResponseLength: 0
    };

    // Contar por fonte
    data.forEach(item => {
      const source = item.response_source || 'unknown';
      stats.sources[source] = (stats.sources[source] || 0) + 1;
      
      if (item.response_sent) {
        stats.totalResponseLength += item.response_sent.length;
      }
    });

    // Calcular média de comprimento das respostas
    stats.averageResponseLength = stats.total > 0 ? Math.round(stats.totalResponseLength / stats.total) : 0;

    // Agrupar por dia
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      stats.daily[date] = (stats.daily[date] || 0) + 1;
    });

    // Agrupar por hora
    data.forEach(item => {
      const hour = new Date(item.created_at).getHours();
      stats.hourly[hour] = (stats.hourly[hour] || 0) + 1;
    });

    res.json({ stats });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;