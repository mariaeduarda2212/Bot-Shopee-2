import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, CheckCircle, AlertCircle, Loader, Users, MessageSquare } from 'lucide-react';
import { apiService, WhatsAppStatus, GroupInfo } from '../services/api';

interface WhatsAppConnectionProps {
  onConnectionChange: (connected: boolean) => void;
}

export const WhatsAppConnection: React.FC<WhatsAppConnectionProps> = ({ onConnectionChange }) => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    isConnected: false
  });
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConnectingGroup, setIsConnectingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GROUP_INVITE_LINK = 'https://chat.whatsapp.com/Jp6CrkydfLy32KEku2Qff9';

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    onConnectionChange(status.isConnected);
  }, [status.isConnected, onConnectionChange]);

  const checkStatus = async () => {
    try {
      const currentStatus = await apiService.getWhatsAppStatus();
      setStatus(currentStatus);
      setError(null);

      if (currentStatus.isConnected && currentStatus.groupId) {
        const group = await apiService.getGroupInfo();
        setGroupInfo(group);
      }
    } catch (error) {
      // Só mostrar erro se for um erro real, não de conexão inicial
      if (!error.message.includes('Servidor não está rodando')) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao conectar com o servidor';
        setError(errorMessage);
        console.error('Erro ao verificar status:', errorMessage);
      }
    }
  };

  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      await apiService.initializeWhatsApp();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao inicializar WhatsApp');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleConnectGroup = async () => {
    try {
      setIsConnectingGroup(true);
      setError(null);
      const group = await apiService.connectToGroup(GROUP_INVITE_LINK);
      setGroupInfo(group);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao conectar ao grupo');
    } finally {
      setIsConnectingGroup(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiService.disconnectWhatsApp();
      setGroupInfo(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao desconectar');
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected': return 'text-green-600';
      case 'qr_code': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'qr_code': return <QrCode className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Smartphone className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connected': return 'Conectado';
      case 'qr_code': return 'Aguardando QR Code';
      case 'error': return 'Erro na conexão';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Smartphone className="w-5 h-5" />
          <span>Conexão WhatsApp</span>
        </h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Status desconectado */}
      {status.status === 'disconnected' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Para começar a enviar mensagens, você precisa conectar sua conta do WhatsApp.
          </p>
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isInitializing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Inicializando...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Conectar WhatsApp</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* QR Code */}
      {status.status === 'qr_code' && status.qrCode && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Escaneie o QR Code abaixo com seu WhatsApp:
            </p>
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
              <img 
                src={status.qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo
            </p>
          </div>
        </div>
      )}

      {/* Conectado */}
      {status.status === 'connected' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">WhatsApp conectado com sucesso!</span>
          </div>

          {/* Informações do grupo */}
          {groupInfo ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">{groupInfo.name}</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>👥 {groupInfo.participants} participantes</p>
                <p>✅ Pronto para enviar mensagens</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Agora conecte ao grupo de promoções para começar a enviar mensagens.
              </p>
              <button
                onClick={handleConnectGroup}
                disabled={isConnectingGroup}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isConnectingGroup ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Conectando ao grupo...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Conectar ao Grupo de Promoções</span>
                  </>
                )}
              </button>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Desconectar WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};