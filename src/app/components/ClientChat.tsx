'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Send,
  Phone,
  Mail,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'client' | 'support' | 'system';
  senderName: string;
  message: string;
  timestamp: string;
  sentAt?: string;
  status?: 'sent' | 'received' | 'failed';
  source?: string;
  direction?: 'outbound' | 'inbound' | 'internal';
  webhookStatus?: number | null;
  attachments?: string[];
  type?: 'message' | 'note' | 'alert';
}

interface ClientChatProps {
  clientId: string;
  clientName: string;
  messages: ChatMessage[];
  clientEmail?: string;
  clientPhone?: string;
}

const ClientChat: React.FC<ClientChatProps> = ({
  clientId,
  clientName,
  messages: initialMessages,
  clientEmail,
  clientPhone,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Load messages from API on component mount or when clientId changes
  useEffect(() => {
    setChatMessages(initialMessages);
    loadConversationHistory();

    // Poll for new messages every 3 seconds
    const pollInterval = setInterval(() => {
      loadConversationHistory();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [clientId]);

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/webhooks/conversations?clientId=${clientId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        console.log('[ClientChat] Loaded conversation data:', data);
        if (data.data?.messages) {
          // Convert API messages to ChatMessage format
          // sender === 'system' → OUTPUT (mensagens enviadas)
          // sender !== 'system' → INPUT (mensagens recebidas)
          const apiMessages = data.data.messages.map((msg: any) => ({
            id: msg.id,
            sender: msg.sender === 'system' ? 'support' : 'client',
            senderName: msg.senderName,
            message: msg.message,
            timestamp: msg.timestamp,
            sentAt: msg.sentAt,
            status: msg.status,
            source: msg.source,
            direction: msg.direction,
            webhookStatus: msg.webhookStatus,
            type: msg.type || 'message',
          }));
          console.log('[ClientChat] Setting messages:', apiMessages.length, 'messages');
          setChatMessages(apiMessages);
        } else {
          console.log('[ClientChat] No messages in conversation');
        }
      } else {
        console.warn('[ClientChat] Failed to load conversation:', response.status);
      }
    } catch (error) {
      console.error('[ClientChat] Error loading conversation history:', error);
      // Fall back to initial messages if API fails
      setChatMessages(initialMessages);
    }
  };

  const filteredMessages = chatMessages.filter(
    (msg) =>
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    const timestamp = new Date().toLocaleTimeString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Optimistic update - add message to UI immediately
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'support', // Exibido como support (OUTPUT)
      senderName: 'Support Team',
      message: messageText,
      timestamp,
      status: 'sent',
      source: 'dashboard',
      direction: 'outbound',
      type: 'message',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Persist + send webhook in one API call
      const sendRes = await fetch('/api/webhooks/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          clientName,
          clientEmail,
          clientPhone,
          message: messageText,
          senderName: 'Support Team',
          sender: 'system', // Envia como 'system' = OUTPUT
          timestamp,
        }),
      });

      if (!sendRes.ok) {
        throw new Error(`Failed to send message: ${sendRes.statusText}`);
      }

      await loadConversationHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message if save failed
      setChatMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col h-full overflow-hidden">
      {/* Header - Compact */}
      <div className="border-b border-slate-700 p-3 flex-shrink-0 space-y-2">
        <h2 className="text-sm font-bold text-white truncate">{clientName}</h2>
        
        {/* Contact Info */}
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          {clientPhone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span className="truncate text-xs">{clientPhone}</span>
            </div>
          )}
          {clientEmail && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span className="truncate text-xs">{clientEmail}</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3 h-3 text-slate-600" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0" id="messages-container">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'support' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded px-3 py-2 text-xs space-y-1 ${
                  message.sender === 'support'
                    ? 'bg-blue-600/20 border border-blue-600/30'
                    : message.type === 'alert'
                    ? 'bg-red-600/20 border border-red-600/30'
                    : message.type === 'note'
                    ? 'bg-amber-600/20 border border-amber-600/30'
                    : 'bg-slate-700 border border-slate-600'
                } text-slate-200`}
              >
                <p className="font-semibold text-slate-300 text-sm">
                  {message.senderName.split(' - ')[0]}
                </p>
                <p className="text-sm leading-relaxed">{message.message}</p>
                <p className="text-slate-500 text-xs">{message.timestamp}</p>
                <p className="text-slate-500 text-[10px] leading-tight">
                  {`status: ${message.status || 'n/a'} • origem: ${message.source || 'n/a'}`}
                  {typeof message.webhookStatus === 'number' ? ` • webhook: ${message.webhookStatus}` : ''}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 text-xs py-4">
            Nenhuma mensagem
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-2 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500"
          />
          <button
            onClick={handleSendMessage}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newMessage.trim() || isLoading}
            title="Enviar"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientChat;
