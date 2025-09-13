import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const WhatsAppContext = createContext();

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp deve ser usado dentro de um WhatsAppProvider');
  }
  return context;
};

export const WhatsAppProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState({});
  const [messages, setMessages] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const { user, registerLogoutCallback } = useAuth();

  // Cleanup function for logout
  const cleanup = useCallback(() => {
    console.log('🧹 Limpando estado do WhatsApp...');
    setSessions([]);
    setQrCodes({});
    setMessages({});
    setConnectionStatus('disconnected');
    setLoading(false);
  }, []);

  // Register cleanup callback on AuthContext
  useEffect(() => {
    if (registerLogoutCallback) {
      const unregister = registerLogoutCallback(cleanup);
      return unregister;
    }
  }, [registerLogoutCallback, cleanup]);

  // Initialize real WhatsApp service
  useEffect(() => {
    if (user) {
      refreshSessions();
    }
  }, [user]);

  // Create new session (real API)
  const createSession = useCallback(async (sessionName = 'WhatsApp Session') => {
    if (!user) {
      toast.error('Você precisa estar logado para criar uma sessão');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/whatsapp/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ name: sessionName })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sessão');
      }

      const data = await response.json();
      
      // Refresh sessions to get updated list
      await refreshSessions();
      
      toast.success('Sessão criada com sucesso!');
      return data.sessionId;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      toast.error('Erro ao criar sessão: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Disconnect session (real API)
  const disconnectSession = useCallback(async (sessionId) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao desconectar sessão');
      }

      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setQrCodes(prev => {
        const newQrCodes = { ...prev };
        delete newQrCodes[sessionId];
        return newQrCodes;
      });
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[sessionId];
        return newMessages;
      });
      
      toast.success('Sessão desconectada com sucesso!');
    } catch (error) {
      console.error('Erro ao desconectar sessão:', error);
      toast.error('Erro ao desconectar sessão: ' + error.message);
    }
  }, [user]);

  // Send message (real API)
  const sendMessage = useCallback(async (sessionId, phone, message) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          sessionId,
          phone,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();
      
      // Add message to local state
      const newMessage = {
        id: data.messageId || Date.now().toString(),
        from: 'me',
        to: phone,
        body: message,
        timestamp: new Date().toISOString(),
        type: 'sent'
      };

      setMessages(prev => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] || []), newMessage]
      }));

      toast.success('Mensagem enviada com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem: ' + error.message);
      throw error;
    }
  }, [user]);

  // Get QR Code (real API)
  const getQRCode = useCallback(async (sessionId) => {
    if (!user) return null;

    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/qrcode`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao obter QR Code');
      }

      const data = await response.json();
      return data.qrCode;
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      return null;
    }
  }, [user]);

  // Refresh sessions (real API)
  const refreshSessions = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/whatsapp/sessions', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar sessões');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setConnectionStatus(data.sessions?.length > 0 ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      setConnectionStatus('error');
    }
  }, [user]);

  // Reconnect session (real API)
  const reconnectSession = useCallback(async (sessionId) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/reconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao reconectar sessão');
      }

      // Update session status
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'connecting' }
          : session
      ));
      
      // Refresh sessions to get updated status
      setTimeout(() => {
        refreshSessions();
      }, 2000);
      
      toast.success('Reconectando sessão...');
    } catch (error) {
      console.error('Erro ao reconectar sessão:', error);
      toast.error('Erro ao reconectar sessão: ' + error.message);
    }
  }, [user, refreshSessions]);

  // Obter status da sessão
  const getSessionStatus = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.status || 'disconnected';
  }, [sessions]);

  // Obter mensagens da sessão
  const getSessionMessages = useCallback((sessionId) => {
    return messages[sessionId] || [];
  }, [messages]);

  // Limpar mensagens da sessão
  const clearSessionMessages = useCallback((sessionId) => {
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[sessionId];
      return newMessages;
    });
  }, []);



  const value = {
    // Estados
    sessions,
    loading,
    qrCodes,
    messages,
    connectionStatus,
    
    // Funções
    createSession,
    disconnectSession,
    sendMessage,
    getSessionStatus,
    getSessionMessages,
    clearSessionMessages,
    getQRCode,
    refreshSessions,
    reconnectSession,
    cleanup,
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};