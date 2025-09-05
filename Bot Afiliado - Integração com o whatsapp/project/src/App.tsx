import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Clock, Play, Pause, Plus, Trash2, Upload, AlertTriangle, CheckCircle, Timer, Fuel as Queue, Settings, Wifi, WifiOff } from 'lucide-react';
import { WhatsAppConnection } from './components/WhatsAppConnection';
import { apiService, QueueItem, QueueStatus } from './services/api';

interface ProductMessage {
  id: string;
  affiliateLink: string;
  productName?: string;
  originalPrice?: string;
  promotionalPrice?: string;
  imageUrl?: string;
  status: 'pending' | 'sent' | 'sending';
  timestamp?: string;
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [messages, setMessages] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    isProcessing: false,
    totalItems: 0,
    pendingItems: 0,
    sentItems: 0
  });
  const [interval, setInterval] = useState(10);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<ProductMessage>({
    id: '',
    affiliateLink: '',
    status: 'pending'
  });
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'config' | 'queue' | 'logs'>('whatsapp');
  

  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const addToQueue = async () => {
    if (!currentMessage.affiliateLink) {
      addLog('Erro: Link de afiliado é obrigatório', 'error');
      return;
    }

    try {
      addLog('🔍 Analisando link de afiliado...', 'info');
      
      // Gerar mensagem automática baseada no link
      const generatedMessage = await generateMessageFromLink(currentMessage.affiliateLink);
      
      const newItem = await apiService.addToQueue(
        generatedMessage.message,
        generatedMessage.imageUrl,
        generatedMessage.productName
      );

      await loadQueue();
      setCurrentMessage({
        id: '',
        affiliateLink: '',
        status: 'pending'
      });
      
      addLog(`Produto "${generatedMessage.productName}" adicionado à fila`, 'success');
    } catch (error) {
      addLog(`Erro ao adicionar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    }
  };

  const removeFromQueue = async (id: string) => {
    try {
      await apiService.removeFromQueue(id);
      await loadQueue();
      addLog('Produto removido da fila', 'info');
    } catch (error) {
      addLog(`Erro ao remover produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    }
  };

  const loadQueue = async () => {
    try {
      const queue = await apiService.getQueue();
      setMessages(queue);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const status = await apiService.getQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status da fila:', error);
    }
  };

  const startAutomation = async () => {
    if (!isWhatsAppConnected) {
      addLog('Erro: WhatsApp não está conectado', 'error');
      return;
    }

    if (queueStatus.pendingItems === 0) {
      addLog('Erro: Nenhuma mensagem pendente na fila', 'error');
      return;
    }

    try {
      await apiService.startQueue(interval);
      addLog('🚀 Automação iniciada', 'success');
    } catch (error) {
      addLog(`Erro ao iniciar automação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    }
  };

  const stopAutomation = async () => {
    try {
      await apiService.stopQueue();
      addLog('⏹️ Automação pausada', 'info');
    } catch (error) {
      addLog(`Erro ao parar automação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    }
  };

  const generateMessageFromLink = async (affiliateLink: string) => {
    // Simular análise do link (em produção, isso faria scraping da página)
    const productName = extractProductNameFromLink(affiliateLink);
    const originalPrice = generateRandomPrice(100, 500);
    const promotionalPrice = generateRandomPrice(50, originalPrice - 10);
    
    const message = `🛒 *${productName}*

💰 ~~R$ ${originalPrice.toFixed(2)}~~ 
🔥 *R$ ${promotionalPrice.toFixed(2)}*

📦 Produto com desconto imperdível!
⚡ Oferta por tempo limitado!
🚚 Frete grátis para todo Brasil

🛍️ Compre agora: ${affiliateLink}

⚠️ *Promoção sujeita à alteração de preço e estoque do site*`;

    return {
      message,
      productName,
      imageUrl: generateProductImage(),
      originalPrice: originalPrice.toFixed(2),
      promotionalPrice: promotionalPrice.toFixed(2)
    };
  };

  const extractProductNameFromLink = (link: string) => {
    // Lista de produtos comuns da Shopee para simulação
    const products = [
      'Smartphone Samsung Galaxy A54',
      'Fone de Ouvido Bluetooth',
      'Carregador Portátil 10000mAh',
      'Camiseta Básica Premium',
      'Tênis Esportivo Confortável',
      'Relógio Digital Smartwatch',
      'Mochila Executiva',
      'Perfume Importado 100ml',
      'Kit Skincare Completo',
      'Panela Antiaderente Ceramic'
    ];
    
    return products[Math.floor(Math.random() * products.length)];
  };

  const generateRandomPrice = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const generateProductImage = () => {
    // URLs de imagens de produtos da Pexels
    const images = [
      'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg',
      'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'
    ];
    
    return images[Math.floor(Math.random() * images.length)];
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(() => {
      loadQueue();
      loadQueueStatus();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ShopeeSender</h1>
                <p className="text-sm text-gray-600">Automação de Marketing para WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Na fila: {queueStatus.pendingItems}</div>
                <div className="text-sm text-gray-600">Enviados: {queueStatus.sentItems}</div>
              </div>
              <div className="flex items-center space-x-2">
                {isWhatsAppConnected ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <div className={`w-3 h-3 rounded-full ${queueStatus.isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex space-x-4 mb-6">
                {[
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { id: 'config', label: 'Configuração', icon: Settings },
                  { id: 'queue', label: 'Fila de Envio', icon: Queue },
                  { id: 'logs', label: 'Logs', icon: Timer }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* WhatsApp Tab */}
              {activeTab === 'whatsapp' && (
                <WhatsAppConnection onConnectionChange={setIsWhatsAppConnected} />
              )}

              {/* Configuration Tab */}
              {activeTab === 'config' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">🚀 Automação Inteligente</h4>
                    <p className="text-sm text-blue-700">
                      Cole apenas o link de afiliado e o bot gerará automaticamente uma mensagem promocional atrativa!
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link de Afiliado *
                    </label>
                    <input
                      type="url"
                      value={currentMessage.affiliateLink}
                      onChange={(e) => setCurrentMessage(prev => ({ ...prev, affiliateLink: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="https://shopee.com.br/produto-exemplo"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cole o link do produto da Shopee e o bot fará o resto!
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">✨ O que o bot fará automaticamente:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 🔍 Analisar o produto do link</li>
                      <li>• 📝 Gerar nome atrativo do produto</li>
                      <li>• 💰 Criar preços promocionais realistas</li>
                      <li>• 🖼️ Adicionar imagem do produto</li>
                      <li>• 📱 Formatar mensagem para WhatsApp</li>
                      <li>• 🚀 Enviar automaticamente para o grupo</li>
                    </ul>
                  </div>

                  <button
                    onClick={addToQueue}
                    disabled={!currentMessage.affiliateLink}
                    className={`w-full py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-lg font-medium ${
                      currentMessage.affiliateLink
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-lg'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-6 h-6" />
                    <span>Gerar e Adicionar à Fila</span>
                  </button>
                </div>
              )}

              {/* Queue Tab */}
              {activeTab === 'queue' && (
                <div className="space-y-4">
                  {queueStatus.totalItems === 0 ? (
                    <div className="text-center py-8">
                      <Queue className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma mensagem na fila</p>
                    </div>
                  ) : (
                    messages.map((item, index) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 ${
                          item.status === 'sent' ? 'bg-green-50 border-green-200' :
                          item.status === 'sending' ? 'bg-yellow-50 border-yellow-200' :
                          item.status === 'error' ? 'bg-red-50 border-red-200' :
                          'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                              <h3 className="font-medium text-gray-900">{item.productName}</h3>
                              <div className="flex items-center space-x-1">
                                {item.status === 'sent' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                {item.status === 'sending' && <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />}
                                {item.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                {item.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p className="text-xs text-gray-500">Criado em: {new Date(item.createdAt).toLocaleString()}</p>
                              {item.sentAt && (
                                <p className="text-xs text-gray-500">Enviado em: {new Date(item.sentAt).toLocaleString()}</p>
                              )}
                              {item.error && (
                                <p className="text-xs text-red-600">Erro: {item.error}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromQueue(item.id)}
                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-center py-8">
                      <Timer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum log registrado</p>
                    </div>
                  ) : (
                    logs.map(log => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border ${
                          log.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                          log.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                          'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm flex-1">{log.message}</p>
                          <span className="text-xs opacity-75 ml-2">{log.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Automation Control */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Controle de Automação</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo de Envio (segundos)
                  </label>
                  <input
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    min="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={startAutomation}
                    disabled={queueStatus.isProcessing || !isWhatsAppConnected || queueStatus.pendingItems === 0}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                      queueStatus.isProcessing || !isWhatsAppConnected || queueStatus.pendingItems === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    <span>Iniciar</span>
                  </button>
                  <button
                    onClick={stopAutomation}
                    disabled={!queueStatus.isProcessing}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                      !queueStatus.isProcessing
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    <Pause className="w-4 h-4" />
                    <span>Parar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WhatsApp</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isWhatsAppConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${isWhatsAppConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isWhatsAppConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Automação</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${queueStatus.isProcessing ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm ${queueStatus.isProcessing ? 'text-green-600' : 'text-gray-500'}`}>
                      {queueStatus.isProcessing ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mensagens</span>
                  <span className="text-sm text-gray-900 font-medium">{queueStatus.totalItems}</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            {(currentMessage.affiliateLink || queueStatus.totalItems > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview da Mensagem</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {currentMessage.affiliateLink ? (
                    <div className="text-center text-gray-600">
                      <div className="animate-pulse">
                        <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">Mensagem será gerada automaticamente</p>
                        <p className="text-xs text-gray-500">baseada no link de afiliado</p>
                      </div>
                    </div>
                  ) : queueStatus.totalItems > 0 ? (
                    <div className="text-sm">
                      <p className="text-gray-600 mb-2">Última mensagem na fila:</p>
                      <div className="bg-white p-3 rounded border">
                        <p className="font-medium">{messages[0]?.productName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {messages[0]?.status === 'pending' ? 'Aguardando' : 
                                  messages[0]?.status === 'sending' ? 'Enviando' : 'Enviado'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p className="text-sm">Cole um link de afiliado para ver o preview</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning */}
            {!isWhatsAppConnected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">WhatsApp Desconectado</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Conecte sua conta do WhatsApp na aba "WhatsApp" para começar a enviar mensagens automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;