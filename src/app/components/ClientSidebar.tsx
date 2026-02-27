'use client';

import React from 'react';
import { MessageCircle, Search, Plus, MoreVertical } from 'lucide-react';

export interface Client {
  id: string;
  name: string;
  status: 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
  riskLevel: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface ClientSidebarProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string | null) => void;
}

const ClientSidebar: React.FC<ClientSidebarProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRÍTICO':
        return 'bg-red-600';
      case 'ALTO':
        return 'bg-orange-500';
      case 'MÉDIO':
        return 'bg-amber-500';
      case 'BAIXO':
        return 'bg-green-500';
      default:
        return 'bg-slate-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'CRÍTICO':
        return 'bg-red-950/30 hover:bg-red-950/50';
      case 'ALTO':
        return 'bg-orange-950/30 hover:bg-orange-950/50';
      case 'MÉDIO':
        return 'bg-amber-950/30 hover:bg-amber-950/50';
      case 'BAIXO':
        return 'bg-green-950/30 hover:bg-green-950/50';
      default:
        return 'bg-slate-900/30 hover:bg-slate-900/50';
    }
  };

  return (
    <div className="w-full md:w-80 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Clientes</h1>
          </div>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Button */}
        <button
          onClick={() => onSelectClient(null)}
          className={`w-full mb-4 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
            selectedClientId === null
              ? 'bg-slate-700 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          ← Dashboard Geral
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 group ${
                  selectedClientId === client.id
                    ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-600/50'
                    : `${getStatusBgColor(client.status)} border border-slate-700/50`
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          client.status
                        )} flex-shrink-0`}
                      />
                      <h3 className="text-sm font-semibold text-white truncate">
                        {client.name}
                      </h3>
                    </div>
                    {client.lastMessage && (
                      <p className="text-xs text-slate-400 truncate leading-tight">
                        {client.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">
                        {client.status}
                      </span>
                      {client.lastMessageTime && (
                        <span className="text-xs text-slate-500">
                          {client.lastMessageTime}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded transition-all text-slate-400 hover:text-slate-200 flex-shrink-0 cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-slate-700 p-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-slate-400 mb-1">Total Clientes</p>
            <p className="text-lg font-bold text-white">{clients.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-slate-400 mb-1">Críticos</p>
            <p className="text-lg font-bold text-red-400">
              {clients.filter((c) => c.status === 'CRÍTICO').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSidebar;
