require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth');
const whatsappRoutes = require('./routes/whatsapp');
const trainingRoutes = require('./routes/training');
const conversationRoutes = require('./routes/conversations');
const aiRoutes = require('./routes/ai');
const zapiRoutes = require('./routes/zapiRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const configRoutes = require('./routes/configRoutes');
const evolutionRoutes = require('./routes/evolutionRoutes');

// Importar serviços
const whatsappService = require('./services/whatsappService');
const supabaseService = require('./services/supabaseService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/zapi', zapiRoutes);
app.use('/api/config', configRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/webhook', webhookRoutes);

// Rota para verificar status da API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota de teste para verificar se as tabelas existem
app.get('/api/test-tables', async (req, res) => {
  try {
    const supabase = require('./services/supabaseService');
    
    // Testar tabela users
    const { data: usersData, error: usersError } = await supabase.client
      .from('users')
      .select('count')
      .limit(1);
    
    // Testar tabela training_data
    const { data: trainingData, error: trainingError } = await supabase.client
      .from('training_data')
      .select('count')
      .limit(1);
    
    res.json({
      status: 'OK',
      tables: {
        users: {
          exists: !usersError,
          error: usersError?.message || null
        },
        training_data: {
          exists: !trainingError,
          error: trainingError?.message || null
        }
      }
    });
  } catch (error) {
    console.error('Erro ao testar tabelas:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      message: 'As tabelas do Supabase ainda não foram criadas. Execute o script SQL fornecido.'
    });
  }
});

// Rota catch-all para SPA em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Associar socket ao usuário quando autenticado
  socket.on('authenticate', (data) => {
    if (data.userId) {
      socket.join(`user_${data.userId}`);
      console.log(`Usuário ${data.userId} entrou na sala`);
    }
  });

  // Sair da sala do usuário
  socket.on('leave_user', (data) => {
    if (data.userId) {
      socket.leave(`user_${data.userId}`);
      console.log(`Usuário ${data.userId} saiu da sala`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Exportar io para uso nos webhooks
module.exports = { io };

// Disponibilizar io para outros módulos
app.set('io', io);

// Inicializar serviços
async function initializeServices() {
  try {
    await supabaseService.initialize();
    console.log('✅ Supabase inicializado com sucesso');
    
    await whatsappService.initialize(io);
    console.log('✅ Serviço WhatsApp inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error);
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  await initializeServices();
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});