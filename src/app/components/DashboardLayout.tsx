'use client';

import React, { useState, useEffect } from 'react';
import ClientSidebar, { Client } from '@/app/components/ClientSidebar';
import MainDashboard from '@/app/components/MainDashboard';
import CriticalRiskCard from '@/app/components/CriticalRiskCard';
import ClientChat from '@/app/components/ClientChat';
import { ClientWithContact } from '@/app/data/clients';

type ClientStatus = 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
type ClientTrend = 'Piorando' | 'Estável' | 'Melhorando';

type DashboardClient = ClientWithContact & {
  chatId?: string;
  trend?: ClientTrend;
  squad?: string;
  detractor?: string;
  evidence?: string;
  evidenceTimestamp?: string;
  actionOwner?: string;
  actionDescription?: string;
  data_evidencia?: string;
  ultima_Mensagem?: string;
  cliente_churn?: string;
};

function parseRiskLevel(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').replace(',', '.').trim());
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function statusFromRiskLevel(riskLevel: number): ClientStatus {
  if (riskLevel >= 75) return 'CRÍTICO';
  if (riskLevel >= 50) return 'ALTO';
  if (riskLevel >= 25) return 'MÉDIO';
  return 'BAIXO';
}

function normalizeStatus(rawStatus: unknown, riskLevel: number): ClientStatus {
  const value = String(rawStatus || '').toUpperCase();

  if (value.includes('CRÍTICO') || value.includes('CRITICO')) return 'CRÍTICO';
  if (value.includes('ALTO')) return 'ALTO';
  if (value.includes('MÉDIO') || value.includes('MEDIO')) return 'MÉDIO';
  if (value.includes('BAIXO')) return 'BAIXO';

  return statusFromRiskLevel(riskLevel);
}

function normalizeTrend(rawTrend: unknown): ClientTrend {
  const value = String(rawTrend || '').toLowerCase();

  if (value.includes('piora')) return 'Piorando';
  if (value.includes('melhor')) return 'Melhorando';
  if (value.includes('estáv') || value.includes('estav')) return 'Estável';

  return 'Estável';
}

const DashboardLayout: React.FC = () => {
  // Começa com null para mostrar dashboard geral
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [apiClients, setApiClients] = useState<DashboardClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Carregar clientes do Supabase via API
  useEffect(() => {
    setIsLoadingClients(true);
    fetch('/api/webhooks/clients')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const mappedClients: DashboardClient[] = data.data.map((item: Record<string, unknown>) => {
            const riskLevel = parseRiskLevel(item.score ?? item.riskLevel ?? item.risco);
            // Se não há score definido (0), marcar como BAIXO em vez de CRÍTICO
            const status = riskLevel === 0 ? 'BAIXO' : normalizeStatus(item.status, riskLevel);

            return {
              id: String(item.id ?? item.Id ?? item.ID ?? ''),
              name: String(item.cliente ?? item.Cliente ?? item.client_name ?? item.name ?? 'Sem nome'),
              status,
              riskLevel,
              email: item.email ? String(item.email) : undefined,
              phone: item.phone ? String(item.phone) : undefined,
              chatId: item.chat_id ? String(item.chat_id) : item.chatId ? String(item.chatId) : undefined,
              lastMessage: item.ultima_Mensagem ? String(item.ultima_Mensagem) : item.lastMessage ? String(item.lastMessage) : item.evidencia ? String(item.evidencia) : undefined,
              lastMessageTime: item.data_evidencia ? String(item.data_evidencia) : item.lastMessageTime ? String(item.lastMessageTime) : undefined,
              trend: normalizeTrend(item.tendencia ?? item.trend),
              squad: item.squad ? String(item.squad) : undefined,
              detractor: item.detrator ? String(item.detrator) : item.detractor ? String(item.detractor) : undefined,
              evidence: item.evidencia ? String(item.evidencia) : item.evidence ? String(item.evidence) : undefined,
              evidenceTimestamp: item.data_evidencia ? String(item.data_evidencia) : item.created_at ? String(item.created_at) : item.evidenceTimestamp ? String(item.evidenceTimestamp) : undefined,
              actionOwner: item.responsavel ? String(item.responsavel) : item.actionOwner ? String(item.actionOwner) : undefined,
              actionDescription: item.acaoRecomendada
                ? String(item.acaoRecomendada)
                : item.actionDescription
                ? String(item.actionDescription)
                : undefined,
              data_evidencia: item.data_evidencia ? String(item.data_evidencia) : undefined,
              ultima_Mensagem: item.ultima_Mensagem ? String(item.ultima_Mensagem) : undefined,
              cliente_churn: item.cliente_churn ? String(item.cliente_churn) : undefined,
            };
          }).filter((client: DashboardClient) => client.id);

          console.log('[DashboardLayout] Clients loaded from API:', mappedClients.length);
          setApiClients(mappedClients);
        }
      })
      .catch(err => console.error('Erro carregando clientes:', err))
      .finally(() => setIsLoadingClients(false));
  }, []);

  // Listagem deve vir apenas da tabela Clientes_Database via API
  const clients = apiClients;

  // Buscar cliente selecionado nos dados corretos (API ou mock)
  const selectedClient = selectedClientId 
    ? (clients.find((c) => c.id === selectedClientId) as DashboardClient | undefined)
    : undefined;

  const clientDetails = selectedClientId && selectedClient
    ? {
        squad: selectedClient.squad || 'Não atribuído',
        detractor: selectedClient.detractor || 'Não identificado',
        evidence: selectedClient.evidence || 'Análise pendente',
        evidenceTimestamp: selectedClient.evidenceTimestamp || new Date().toLocaleDateString('pt-BR'),
        actionOwner: selectedClient.actionOwner || 'Não atribuído',
        actionDescription: selectedClient.actionDescription || 'Aguardando análise inicial',
        trend: selectedClient.trend || 'Estável' as const,
      }
    : {
        squad: 'Não atribuído',
        detractor: 'Não identificado',
        evidence: 'Análise pendente',
        evidenceTimestamp: new Date().toLocaleDateString('pt-BR'),
        actionOwner: 'Não atribuído',
        actionDescription: 'Aguardando análise inicial',
        trend: 'Estável' as const,
      };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden">
      {/* Client Sidebar - Left */}
      <div className="hidden md:flex w-80 flex-shrink-0 border-r border-slate-700">
        <ClientSidebar
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0">
        {/* Risk Card Section */}
        <div className="flex-1 min-w-0 overflow-auto">
          {selectedClient ? (
            <CriticalRiskCard
              clientName={selectedClient.name}
              riskLevel={selectedClient.riskLevel}
              status={selectedClient.status}
              trend={clientDetails?.trend || 'Estável'}
              squad={clientDetails?.squad || 'Não atribuído'}
              detractor={clientDetails?.detractor || 'Não identificado'}
              evidence={clientDetails?.evidence || 'Análise pendente'}
              evidenceTimestamp={clientDetails?.evidenceTimestamp || new Date().toLocaleDateString('pt-BR')}
              actionOwner={clientDetails?.actionOwner || 'Não atribuído'}
              actionDescription={clientDetails?.actionDescription || 'Aguardando análise inicial'}
            />
          ) : (
            <MainDashboard clients={clients} />
          )}
        </div>

        {/* Chat Sidebar - Right - Fixed Width */}
        {selectedClient && (
          <div className="hidden lg:flex flex-col border-l border-slate-700 flex-shrink-0 w-[550px]">
            <ClientChat
              clientId={selectedClientId!}
              clientName={selectedClient.name}
              messages={[]}
              clientEmail={selectedClient.email}
              clientPhone={selectedClient.phone}
            />
          </div>
        )}
      </div>

      {/* Mobile Sidebar Toggle - Optional */}
      <style jsx>{`
        @media (max-width: 768px) {
          .md\\:flex {
            display: none;
          }
        }
        @media (max-width: 1024px) {
          .lg\\:block {
            display: none;
          }
          .lg\\:flex {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
