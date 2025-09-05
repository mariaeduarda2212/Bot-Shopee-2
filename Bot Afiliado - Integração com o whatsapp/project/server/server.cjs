const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Fila de mensagens
let messageQueue = [];
let isProcessingQueue = false;
let queueInterval = null;

// Estado do WhatsApp
let whatsappStatus = {
  status: 'disconnected',
  isConnected: false,
  qrCode: null,
  groupId: null
};

// Simulação do serviço WhatsApp (versão simplificada para desenvolvimento)
const whatsappService = {
  async initialize() {
    console.log('🚀 Inicializando WhatsApp...');
    whatsappStatus.status = 'qr_code';
    whatsappStatus.qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Simular conexão após 5 segundos
    setTimeout(() => {
      whatsappStatus.status = 'connected';
      whatsappStatus.isConnected = true;
      console.log('✅ WhatsApp conectado!');
    }, 5000);
    
    return true;
  },

  async findGroupByInviteLink(inviteLink) {
    console.log('🔍 Conectando ao grupo...');
    whatsappStatus.groupId = 'grupo-promocoes-123';
    return {
      id: 'grupo-promocoes-123',
      name: 'Grupo de Promoções Shopee',
      participants: 150
    };
  },

  async sendMessage(message, imageUrl) {
    console.log('📤 Enviando mensagem:', message.substring(0, 50) + '...');
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },

  async getGroupInfo() {
    if (!whatsappStatus.groupId) return null;
    return {
      id: whatsappStatus.groupId,
      name: 'Grupo de Promoções Shopee',
      participants: 150,
      description: 'Grupo para promoções da Shopee'
    };
  },

  async disconnect() {
    whatsappStatus = {
      status: 'disconnected',
      isConnected: false,
      qrCode: null,
      groupId: null
    };
    console.log('🔌 WhatsApp desconectado');
  },

  getStatus() {
    return whatsappStatus;
  }
};

// Rotas da API

// Status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  res.json(whatsappService.getStatus());
});

// Inicializar WhatsApp
app.post('/api/whatsapp/initialize', async (req, res) => {
  try {
    await whatsappService.initialize();
    res.json({ success: true, message: 'WhatsApp inicializado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conectar ao grupo
app.post('/api/whatsapp/connect-group', async (req, res) => {
  try {
    const { inviteLink } = req.body;
    
    if (!inviteLink) {
      return res.status(400).json({ success: false, error: 'Link do grupo é obrigatório' });
    }

    const groupInfo = await whatsappService.findGroupByInviteLink(inviteLink);
    res.json({ success: true, group: groupInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter informações do grupo
app.get('/api/whatsapp/group-info', async (req, res) => {
  try {
    const groupInfo = await whatsappService.getGroupInfo();
    res.json({ success: true, group: groupInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { message, imageUrl } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Mensagem é obrigatória' });
    }

    const result = await whatsappService.sendMessage(message, imageUrl);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Adicionar mensagem à fila
app.post('/api/queue/add', (req, res) => {
  try {
    const { message, imageUrl, productName } = req.body;
    
    const queueItem = {
      id: Date.now().toString(),
      message,
      imageUrl,
      productName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    messageQueue.push(queueItem);
    res.json({ success: true, item: queueItem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter fila
app.get('/api/queue', (req, res) => {
  res.json({ success: true, queue: messageQueue });
});

// Remover item da fila
app.delete('/api/queue/:id', (req, res) => {
  try {
    const { id } = req.params;
    messageQueue = messageQueue.filter(item => item.id !== id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar processamento da fila
app.post('/api/queue/start', (req, res) => {
  try {
    const { interval = 10 } = req.body;

    if (isProcessingQueue) {
      return res.status(400).json({ success: false, error: 'Fila já está sendo processada' });
    }

    if (!whatsappStatus.isConnected) {
      return res.status(400).json({ success: false, error: 'WhatsApp não está conectado' });
    }

    isProcessingQueue = true;
    
    queueInterval = setInterval(async () => {
      const pendingItems = messageQueue.filter(item => item.status === 'pending');
      
      if (pendingItems.length === 0) {
        clearInterval(queueInterval);
        isProcessingQueue = false;
        return;
      }

      const nextItem = pendingItems[0];
      
      try {
        nextItem.status = 'sending';
        
        await whatsappService.sendMessage(nextItem.message, nextItem.imageUrl);
        
        nextItem.status = 'sent';
        nextItem.sentAt = new Date().toISOString();
        
        console.log(`✅ Mensagem enviada: ${nextItem.productName}`);
      } catch (error) {
        nextItem.status = 'error';
        nextItem.error = error.message;
        
        console.error(`❌ Erro ao enviar mensagem: ${error.message}`);
      }
    }, interval * 1000);

    res.json({ success: true, message: 'Processamento da fila iniciado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Parar processamento da fila
app.post('/api/queue/stop', (req, res) => {
  try {
    if (queueInterval) {
      clearInterval(queueInterval);
      queueInterval = null;
    }
    isProcessingQueue = false;
    
    res.json({ success: true, message: 'Processamento da fila parado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Status da fila
app.get('/api/queue/status', (req, res) => {
  res.json({ 
    success: true, 
    isProcessing: isProcessingQueue,
    totalItems: messageQueue.length,
    pendingItems: messageQueue.filter(item => item.status === 'pending').length,
    sentItems: messageQueue.filter(item => item.status === 'sent').length
  });
});

// Desconectar WhatsApp
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({ success: true, message: 'WhatsApp desconectado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// Servir aplicação React para todas as outras rotas (apenas em produção)
app.get('*', (req, res) => {
  const distIndexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distIndexPath)) {
    res.sendFile(distIndexPath);
  } else {
    res.json({ 
      message: 'API Server running. Frontend should be served by Vite dev server.',
      endpoints: [
        'GET /api/health',
        'GET /api/whatsapp/status',
        'POST /api/whatsapp/initialize',
        'GET /api/queue',
        'POST /api/queue/add'
      ]
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 API disponível em: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Desconectando WhatsApp...');
  await whatsappService.disconnect();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});