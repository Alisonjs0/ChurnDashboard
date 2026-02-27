'use client';

import React, { useState } from 'react';
import ClientSidebar from '@/app/components/ClientSidebar';
import MainDashboard from '@/app/components/MainDashboard';
import CriticalRiskCard from '@/app/components/CriticalRiskCard';
import ClientChat from '@/app/components/ClientChat';
import { clientsData, ClientWithContact } from '@/app/data/clients';
import { getClientMessages } from '@/app/data/messages';

const DashboardLayout: React.FC = () => {
  // Começa com null para mostrar dashboard geral
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const selectedClient = selectedClientId 
    ? clientsData.find((c) => c.id === selectedClientId) as ClientWithContact | undefined
    : undefined;

  // Dados detalhados para cada cliente
  const clientDetailsMap: Record<
    string,
    {
      squad: string;
      detractor: string;
      evidence: string;
      evidenceTimestamp: string;
      actionOwner: string;
      actionDescription: string;
      trend: 'Piorando' | 'Estável' | 'Melhorando';
    }
  > = {
    '1': {
      squad: 'MCI PLUS',
      detractor: 'Inadimplência/Bloqueio',
      evidence: 'Boa tarde pessoal, mais um pra subir',
      evidenceTimestamp: '23/02/2026',
      actionOwner: 'Vinícius Dino',
      actionDescription: 'Create and share updated image drive by EOD',
      trend: 'Piorando',
    },
    '2': {
      squad: 'TechFlow Team',
      detractor: 'Redução de Uso/Engagement',
      evidence: 'Plataforma com baixa adoção nos últimos 30 dias',
      evidenceTimestamp: '26/02/2026',
      actionOwner: 'Ana Silva',
      actionDescription: 'Agendar reunião de revisão de estratégia com stakeholders',
      trend: 'Piorando',
    },
    '3': {
      squad: 'GlobalPay Support',
      detractor: 'Suporte/Problemas Técnicos',
      evidence: 'Múltiplos tickets abertos, TTR acima da SLA',
      evidenceTimestamp: '25/02/2026',
      actionOwner: 'Carlos Mendes',
      actionDescription: 'Escalar para time técnico sênior e realizar pair debugging',
      trend: 'Piorando',
    },
    '4': {
      squad: 'CloudVision Ops',
      detractor: 'Performance/Latência',
      evidence: 'Degradação de performance em horários de pico',
      evidenceTimestamp: '24/02/2026',
      actionOwner: 'Marina Costa',
      actionDescription: 'Realizar análise de infraestrutura e otimização',
      trend: 'Estável',
    },
    '5': {
      squad: 'DataStream Analytics',
      detractor: 'Preço/ROI',
      evidence: 'Cliente questionando justificativa de valor',
      evidenceTimestamp: '26/02/2026',
      actionOwner: 'Roberto Santos',
      actionDescription: 'Apresentar novo cases de sucesso e métricas de ROI',
      trend: 'Estável',
    },
    '6': {
      squad: 'SecureNet Team',
      detractor: 'Integração',
      evidence: 'Integração com sistemas legados em progresso',
      evidenceTimestamp: '25/02/2026',
      actionOwner: 'Patricia Oliveira',
      actionDescription: 'Finalizar documentação técnica e treinamento',
      trend: 'Melhorando',
    },
    '7': {
      squad: 'InnovateLabs Dev',
      detractor: 'Feature Requests',
      evidence: 'Cliente com backlog de features atendidas',
      evidenceTimestamp: '20/02/2026',
      actionOwner: 'Lucas Ferreira',
      actionDescription: 'Manter momentum com updates mensais de features',
      trend: 'Melhorando',
    },
    '8': {
      squad: 'PowerTech Enterprise',
      detractor: 'Nenhum',
      evidence: 'Cliente em excelente situação, referenciador ativo',
      evidenceTimestamp: '18/02/2026',
      actionOwner: 'Fernanda Lima',
      actionDescription: 'Manter relacionamento estratégico e explorar upsell',
      trend: 'Melhorando',
    },
  };

  const clientDetails = selectedClientId && selectedClient
    ? clientDetailsMap[selectedClientId]
    : null;

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden">
      {/* Client Sidebar - Left */}
      <div className="hidden md:flex w-80 flex-shrink-0 border-r border-slate-700">
        <ClientSidebar
          clients={clientsData}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0">
        {/* Risk Card Section */}
        <div className="flex-1 min-w-0 overflow-auto">
          {selectedClient && clientDetails ? (
            <CriticalRiskCard
              clientName={selectedClient.name}
              riskLevel={selectedClient.riskLevel}
              status={selectedClient.status}
              trend={clientDetails.trend}
              squad={clientDetails.squad}
              detractor={clientDetails.detractor}
              evidence={clientDetails.evidence}
              evidenceTimestamp={clientDetails.evidenceTimestamp}
              actionOwner={clientDetails.actionOwner}
              actionDescription={clientDetails.actionDescription}
            />
          ) : (
            <MainDashboard clients={clientsData} />
          )}
        </div>

        {/* Chat Sidebar - Right - Fixed Width */}
        {selectedClient && (
          <div className="hidden lg:flex flex-col border-l border-slate-700 flex-shrink-0 w-[550px]">
            <ClientChat
              clientId={selectedClientId!}
              clientName={selectedClient.name}
              messages={getClientMessages(selectedClientId!)}
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
