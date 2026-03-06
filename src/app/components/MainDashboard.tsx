'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Client } from './ClientSidebar';

interface MainDashboardProps {
  clients: Client[];
}

const MainDashboard: React.FC<MainDashboardProps> = ({ clients }) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // Calcular métricas
  const totalClients = clients.length;
  const criticalClients = clients.filter((c) => c.status === 'CRÍTICO').length;
  const highRiskClients = clients.filter((c) => c.status === 'ALTO').length;
  const mediumRiskClients = clients.filter((c) => c.status === 'MÉDIO').length;
  const lowRiskClients = clients.filter((c) => c.status === 'BAIXO').length;

  const avgRiskLevel = totalClients > 0
    ? clients.reduce((sum, c) => sum + c.riskLevel, 0) / totalClients
    : 0;
  const atRiskPercentage = totalClients > 0
    ? (((criticalClients + highRiskClients) / totalClients) * 100).toFixed(1)
    : '0.0';
  const pendingActionsCount = criticalClients + highRiskClients;

  const riskDistribution = [
    { status: 'CRÍTICO', count: criticalClients, color: 'bg-red-500' },
    { status: 'ALTO', count: highRiskClients, color: 'bg-orange-500' },
    { status: 'MÉDIO', count: mediumRiskClients, color: 'bg-amber-400' },
    { status: 'BAIXO', count: lowRiskClients, color: 'bg-emerald-500' },
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Dashboard de Gestão de Churn
          </h1>
          <p className="text-slate-300">
            Visão geral da saúde dos clientes e principais indicadores
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/80 rounded-xl p-5 border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Total de Clientes
              </h3>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-5xl font-bold text-white mb-2">{totalClients}</p>
            <p className="text-sm text-slate-200">Em gerenciamento</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/80 rounded-xl p-5 border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Risco Médio
              </h3>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-5xl font-bold text-white mb-2">{avgRiskLevel.toFixed(1)}%</p>
            <p className="text-sm text-slate-200">Média de todos os clientes</p>
          </div>

          <div className="bg-gradient-to-br from-red-900/40 to-red-950/30 rounded-xl p-5 border border-red-700/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-red-300 uppercase tracking-widest">
                Em Risco
              </h3>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <p className="text-5xl font-bold text-red-300 mb-2">{criticalClients + highRiskClients + mediumRiskClients}</p>
            <p className="text-sm text-red-200">{(((criticalClients + highRiskClients + mediumRiskClients) / totalClients) * 100).toFixed(0)}% de {totalClients} clientes</p>
          </div>

          <Link
            href="/acoes-pendentes"
            className="block bg-gradient-to-br from-cyan-900/40 to-cyan-950/30 rounded-xl p-5 border border-cyan-700/30 backdrop-blur-sm hover:from-cyan-900/50 hover:to-cyan-950/40 transition-all"
            title="Abrir lista completa de ações pendentes"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">
                Ações Pendentes
              </h3>
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-5xl font-bold text-cyan-300 mb-2">{pendingActionsCount}</p>
            <p className="text-sm text-cyan-200">Requer atenção imediata</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-900/80 rounded-xl p-6 backdrop-blur-sm border border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-lg">
                  <PieChartIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Distribuição de Risco</h2>
              </div>
            </div>

            <div className="flex gap-8 items-center">
              {/* Gráfico - Esquerda (80%) */}
              <div className="relative flex items-center justify-center w-4/5">
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={160}
                      innerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      startAngle={90}
                      endAngle={450}
                      stroke="none"
                    >
                      {/* Fatias explodidas para riscos */}
                      <Cell 
                        fill="#ef4444" 
                        stroke="none" 
                        onClick={() => {}} 
                        onMouseEnter={() => setHoveredSlice(0)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{ 
                          filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.3))',
                          opacity: hoveredSlice === null || hoveredSlice === 0 ? 1 : 0.4,
                          cursor: 'pointer',
                          transform: hoveredSlice === 0 ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: '50% 50%',
                          transition: 'all 0.2s ease-in-out'
                        }} 
                      />
                      <Cell 
                        fill="#f97316" 
                        stroke="none" 
                        onClick={() => {}} 
                        onMouseEnter={() => setHoveredSlice(1)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{ 
                          filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))',
                          opacity: hoveredSlice === null || hoveredSlice === 1 ? 1 : 0.4,
                          cursor: 'pointer',
                          transform: hoveredSlice === 1 ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: '50% 50%',
                          transition: 'all 0.2s ease-in-out'
                        }} 
                      />
                      <Cell 
                        fill="#eab308" 
                        stroke="none" 
                        onClick={() => {}} 
                        onMouseEnter={() => setHoveredSlice(2)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{ 
                          filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.3))',
                          opacity: hoveredSlice === null || hoveredSlice === 2 ? 1 : 0.4,
                          cursor: 'pointer',
                          transform: hoveredSlice === 2 ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: '50% 50%',
                          transition: 'all 0.2s ease-in-out'
                        }} 
                      />
                      <Cell 
                        fill="#059669" 
                        stroke="none"
                        onMouseEnter={() => setHoveredSlice(3)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{ 
                          opacity: hoveredSlice === null || hoveredSlice === 3 ? 1 : 0.4,
                          cursor: 'pointer',
                          transform: hoveredSlice === 3 ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: '50% 50%',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      /> {/* BAIXO - Verde floresta sutil */}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(12px)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '15px',
                        fontWeight: '700',
                      }}
                      labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '13px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)' }}
                      formatter={(value: any) => [`${value} cliente${value !== 1 ? 's' : ''}`, 'Quantidade']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro do Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-sm text-slate-300 font-semibold">EM RISCO</p>
                  <p className="text-7xl font-bold text-red-400 leading-none mt-2">{criticalClients + highRiskClients + mediumRiskClients}</p>
                  <p className="text-2xl text-red-300 font-semibold mt-2">{(((criticalClients + highRiskClients + mediumRiskClients) / totalClients) * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Legenda - Direita (20%) */}
              <div className="w-1/5">
                <p className="text-sm text-slate-300 font-semibold mb-5 uppercase tracking-widest">Distribuição</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">CRÍTICO</p>
                      <p className="text-sm text-slate-300">{criticalClients} - {((criticalClients / totalClients) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">ALTO</p>
                      <p className="text-sm text-slate-300">{highRiskClients} - {((highRiskClients / totalClients) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">MÉDIO</p>
                      <p className="text-sm text-slate-300">{mediumRiskClients} - {((mediumRiskClients / totalClients) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">BAIXO</p>
                      <p className="text-sm text-slate-300">{lowRiskClients} - {((lowRiskClients / totalClients) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/80 rounded-xl p-6 backdrop-blur-sm border border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Atividades Recentes</h2>
              </div>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/20 hover:border-slate-700/40 transition-colors">
                  <p className="text-sm font-semibold text-slate-100 mb-1">
                    {activity.client}
                  </p>
                  <p className="text-xs text-slate-300 mb-1">{activity.action}</p>
                  <p className="text-xs text-slate-400">{activity.time}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg text-sm font-medium text-slate-200 transition-colors border border-slate-600/30">
              Ver Todas as Atividades
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-950/25 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-red-300 uppercase tracking-widest mb-2">
                  Tendência Preocupante
                </h3>
                <p className="text-white font-medium mb-1">Aumento de Risco</p>
                <p className="text-sm text-slate-300">
                  3 clientes mostram sinais de piora nos últimos 7 dias
                </p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-red-300" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-950/25 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-widest mb-2">
                  Progresso Positivo
                </h3>
                <p className="text-white font-medium mb-1">Melhoria de Risco</p>
                <p className="text-sm text-slate-300">
                  2 clientes apresentam redução de risco após ações tomadas
                </p>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-300 text-sm">
          <p>Dashboard atualizado em tempo real • Última sincronização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
