const venom = require('venom-bot');
const QRCode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.qrCode = null;
    this.status = 'disconnected';
    this.groupId = null;
    this.callbacks = {
      onQRCode: null,
      onConnected: null,
      onDisconnected: null,
      onMessage: null
    };
  }

  async initialize() {
    try {
      console.log('🚀 Iniciando Venom Bot...');
      
      this.client = await venom.create(
        'shopee-sender',
        (base64Qr, asciiQR) => {
          console.log('📱 QR Code gerado:');
          console.log(asciiQR);
          
          this.qrCode = base64Qr;
          this.status = 'qr_code';
          
          if (this.callbacks.onQRCode) {
            this.callbacks.onQRCode(base64Qr);
          }
        },
        (statusSession, session) => {
          console.log('Status da sessão:', statusSession);
          
          if (statusSession === 'isLogged') {
            this.isConnected = true;
            this.status = 'connected';
            console.log('✅ WhatsApp conectado com sucesso!');
            
            if (this.callbacks.onConnected) {
              this.callbacks.onConnected();
            }
          } else if (statusSession === 'notLogged') {
            this.isConnected = false;
            this.status = 'disconnected';
            
            if (this.callbacks.onDisconnected) {
              this.callbacks.onDisconnected();
            }
          }
        },
        {
          folderNameToken: 'tokens',
          mkdirFolderToken: '',
          headless: true,
          devtools: false,
          useChrome: true,
          debug: false,
          logQR: false,
          browserWS: '',
          browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
          puppeteerOptions: {},
          disableWelcome: true,
          updatesLog: false,
          autoClose: 60000,
          createPathFileToken: false,
        }
      );

      // Configurar listeners de mensagens
      this.client.onMessage((message) => {
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(message);
        }
      });

      return this.client;
    } catch (error) {
      console.error('❌ Erro ao inicializar Venom Bot:', error);
      this.status = 'error';
      throw error;
    }
  }

  async findGroupByInviteLink(inviteLink) {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('WhatsApp não está conectado');
      }

      // Extrair o código do grupo do link de convite
      const groupCode = inviteLink.split('/').pop().split('?')[0];
      console.log('🔍 Procurando grupo com código:', groupCode);

      // Listar todos os grupos
      const groups = await this.client.getAllGroups();
      console.log(`📋 Encontrados ${groups.length} grupos`);

      // Procurar pelo grupo específico
      for (const group of groups) {
        try {
          const inviteCode = await this.client.getGroupInviteLink(group.id);
          if (inviteCode && inviteCode.includes(groupCode)) {
            console.log('✅ Grupo encontrado:', group.name);
            this.groupId = group.id;
            return {
              id: group.id,
              name: group.name,
              participants: group.participants.length
            };
          }
        } catch (err) {
          // Ignorar erros de grupos sem permissão
          continue;
        }
      }

      // Se não encontrou, tentar entrar no grupo pelo link
      try {
        console.log('🔗 Tentando entrar no grupo pelo link...');
        const result = await this.client.joinGroup(inviteLink);
        if (result) {
          this.groupId = result.gid;
          return {
            id: result.gid,
            name: 'Grupo de Promoções',
            participants: 0
          };
        }
      } catch (joinError) {
        console.error('❌ Erro ao entrar no grupo:', joinError);
      }

      throw new Error('Grupo não encontrado');
    } catch (error) {
      console.error('❌ Erro ao procurar grupo:', error);
      throw error;
    }
  }

  async sendMessage(message, imageUrl = null) {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('WhatsApp não está conectado');
      }

      if (!this.groupId) {
        throw new Error('Grupo não configurado');
      }

      console.log('📤 Enviando mensagem para o grupo...');

      let result;
      
      if (imageUrl) {
        // Enviar mensagem com imagem
        result = await this.client.sendImage(
          this.groupId,
          imageUrl,
          'produto.jpg',
          message
        );
      } else {
        // Enviar apenas texto
        result = await this.client.sendText(this.groupId, message);
      }

      console.log('✅ Mensagem enviada com sucesso!');
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async getGroupInfo() {
    try {
      if (!this.client || !this.isConnected || !this.groupId) {
        return null;
      }

      const groupInfo = await this.client.getGroupMetadata(this.groupId);
      return {
        id: groupInfo.id,
        name: groupInfo.subject,
        participants: groupInfo.participants.length,
        description: groupInfo.desc
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações do grupo:', error);
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.isConnected = false;
        this.status = 'disconnected';
        this.groupId = null;
        console.log('🔌 WhatsApp desconectado');
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }

  // Métodos para registrar callbacks
  onQRCode(callback) {
    this.callbacks.onQRCode = callback;
  }

  onConnected(callback) {
    this.callbacks.onConnected = callback;
  }

  onDisconnected(callback) {
    this.callbacks.onDisconnected = callback;
  }

  onMessage(callback) {
    this.callbacks.onMessage = callback;
  }

  getStatus() {
    return {
      status: this.status,
      isConnected: this.isConnected,
      qrCode: this.qrCode,
      groupId: this.groupId
    };
  }
}

module.exports = WhatsAppService;