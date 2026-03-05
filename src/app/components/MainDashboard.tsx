'use client';

import React from 'react';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Client } from './ClientSidebar';

interface MainDashboardProps {
  clients: Client[];
}

const MainDashboard: React.FC<MainDashboardProps> = ({ clients }) => {
  // Calcular métricas
  const totalClients = clients.length;
  const criticalClients = clients.filter((c) => c.status === 'CRÍTICO').length;
  const highRiskClients = clients.filter((c) => c.status === 'ALTO').length;
  const mediumRiskClients = clients.filter((c) => c.status === 'MÉDIO').length;
  const lowRiskClients = clients.filter((c) => c.status === 'BAIXO').length;

  const avgRiskLevel =
    clients.reduce((sum, c) => sum + c.riskLevel, 0) / totalClients;
  const atRiskPercentage = (
    ((criticalClients + highRiskClients) / totalClients) *
    100
  ).toFixed(1);

  const riskDistribution = [
    { status: 'CRÍTICO', count: criticalClients, color: 'bg-red-600', bgColor: 'bg-red-950/30' },
    { status: 'ALTO', count: highRiskClients, color: 'bg-orange-500', bgColor: 'bg-orange-950/30' },
    { status: 'MÉDIO', count: mediumRiskClients, color: 'bg-amber-500', bgColor: 'bg-amber-950/30' },
    { status: 'BAIXO', count: lowRiskClients, color: 'bg-green-500', bgColor: 'bg-green-950/30' },
  ];

  const recentActivities = [
    {
      id: 1,
      client: '(MCI PLUS) AEG MEDIA / Nordeste Clube',
      action: 'Status atualizado para CRÍTICO - Problema técnico com Meta',
      time: '26/02/2026 08:11',
      type: 'alert',
    },
    {
      id: 2,
      client: 'Belloscar <> AEG',
      action: 'Aguardando liberação de número para API - Ação: Gabriel',
      time: '26/02/2026 08:13',
      type: 'assignment',
    },
    {
      id: 3,
      client: 'Auto X Veículos',
      action: 'Cliente solicitou atualização do Venda.IA',
      time: '26/02/2026 08:33',
      type: 'meeting',
    },
    {
      id: 4,
      client: 'Primos Protege',
      action: 'Pendente: Envio de link de reunião',
      time: '26/02/2026 09:11',
      type: 'analysis',
    },
    {
      id: 5,
      client: '(MCI PLUS) Auto Energia Baterias',
      action: 'CRÍTICO - Campanha paralisada por inadimplência',
      time: '18/02/2026 15:09',
      type: 'alert',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            Dashboard de Gestão de Churn
          </h1>
          <p className="text-slate-400">
            Visão geral da saúde dos clientes e principais indicadores
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Clients */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Total de Clientes
              </h3>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{totalClients}</p>
            <p className="text-xs text-slate-500">Clientes em gerenciamento</p>
          </div>

          {/* Average Risk Level */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Nível de Risco Médio
              </h3>
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{avgRiskLevel.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Calculado entre todos os clientes</p>
          </div>

          {/* At Risk Percentage */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Em Risco
              </h3>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{atRiskPercentage}%</p>
            <p className="text-xs text-slate-500">
              {criticalClients + highRiskClients} clientes críticos ou altos
            </p>
          </div>

          {/* Ações Pendentes */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Ações Pendentes
              </h3>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{criticalClients}</p>
            <p className="text-xs text-slate-500">Requeres atenção imediata</p>
          </div>
        </div>

        {/* Risk Distribution and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Distribuição de Risco</h2>

            <div className="space-y-4">
              {riskDistribution.map((item) => {
                const percentage = (item.count / totalClients) * 100;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm font-medium text-white">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {item.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/40 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-700">
              <div className={`${riskDistribution[0].bgColor} rounded-lg p-4 border border-slate-700`}>
                <p className="text-xs text-slate-400 mb-1">Críticos</p>
                <p className="text-2xl font-bold text-red-400">{criticalClients}</p>
              </div>
              <div className={`${riskDistribution[3].bgColor} rounded-lg p-4 border border-slate-700`}>
                <p className="text-xs text-slate-400 mb-1">Baixo Risco</p>
                <p className="text-2xl font-bold text-green-400">{lowRiskClients}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Atividades Recentes</h2>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="pb-4 border-b border-slate-700/50 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-white mb-1">
                    {activity.client}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors">
              Ver Todas as Atividades
            </button>
          </div>
        </div>

        {/* Trends Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trend Up */}
          <div className="bg-gradient-to-br from-red-950/30 to-slate-900 rounded-xl border border-red-900/30 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-2">
                  Tendência Preocupante
                </h3>
                <p className="text-white font-medium mb-1">Aumento de Risco</p>
                <p className="text-sm text-slate-400">
                  3 clientes mostram sinais de piora nos últimos 7 dias
                </p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>

          {/* Trend Down */}
          <div className="bg-gradient-to-br from-green-950/30 to-slate-900 rounded-xl border border-green-900/30 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-2">
                  Progresso Positivo
                </h3>
                <p className="text-white font-medium mb-1">Melhoria de Risco</p>
                <p className="text-sm text-slate-400">
                  2 clientes apresentam redução de risco após ações tomadas
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Dashboard atualizado em tempo real • Última sincronização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
