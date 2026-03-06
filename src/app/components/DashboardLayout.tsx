'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').replace(',', '.').trim());
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function clampRiskLevel(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function parseRiskLevel(scoreValue: unknown, fallbackRiskValue: unknown) {
  const score = parseNumericValue(scoreValue);

  // Regra: nivel de risco = 100 - score.
  if (score !== null) {
    if (score === 0) return 0;
    return clampRiskLevel(100 - score);
  }

  const fallbackRisk = parseNumericValue(fallbackRiskValue);
  return clampRiskLevel(fallbackRisk ?? 0);
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
  const searchParams = useSearchParams();
  // Começa com null para mostrar dashboard geral
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [apiClients, setApiClients] = useState<DashboardClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Carregar clientes do Supabase via API
  useEffect(() => {
    setIsLoadingClients(true);
    fetch('/api/webhooks/clients')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const mappedClients: DashboardClient[] = data.data.map((item: Record<string, unknown>) => {
            const riskLevel = parseRiskLevel(item.score, item.riskLevel ?? item.risco);
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

  useEffect(() => {
    const clientIdFromQuery = searchParams.get('clientId');
    if (!clientIdFromQuery) return;

    const exists = clients.some((client) => client.id === clientIdFromQuery);
    if (exists) {
      setSelectedClientId(clientIdFromQuery);
    }
  }, [searchParams, clients]);

  // Ao selecionar cliente, mantém o chat aberto por padrão.
  useEffect(() => {
    if (selectedClientId) {
      setIsChatOpen(true);
    }
  }, [selectedClientId]);

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
      <div className="hidden md:flex w-80 flex-shrink-0">
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

        {/* Chat Sidebar - Right - Animated */}
        {selectedClient && (
          <div className="hidden lg:flex items-stretch relative">
            <div
              className={`relative flex-shrink-0 overflow-hidden bg-slate-800/20 border-l border-slate-700/30 transition-all duration-300 ease-out ${
                isChatOpen ? 'w-[550px] opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="absolute right-3 top-3 z-20 w-8 h-8 rounded-full bg-slate-900/80 text-slate-200 hover:bg-slate-700 transition-colors flex items-center justify-center border border-slate-600/40"
                aria-label="Fechar chat"
                title="Fechar chat"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className={`h-full transition-opacity duration-200 ${isChatOpen ? 'opacity-100' : 'opacity-0'}`}>
                <ClientChat
                  clientId={selectedClientId!}
                  clientName={selectedClient.name}
                  messages={[]}
                  clientEmail={selectedClient.email}
                  clientPhone={selectedClient.phone}
                />
              </div>
            </div>

            {!isChatOpen && (
              <div className="flex items-center pl-2">
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="w-10 h-20 rounded-lg bg-slate-900/80 text-slate-200 hover:bg-slate-700/80 transition-colors flex items-center justify-center border border-slate-600/40"
                  aria-label="Abrir chat"
                  title="Abrir chat"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
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
