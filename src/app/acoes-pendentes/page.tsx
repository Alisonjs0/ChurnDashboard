'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCircle2,
} from 'lucide-react';

type ClientStatus = 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';

type PendingActionClient = {
  id: string;
  name: string;
  status: ClientStatus;
  riskLevel: number;
  actionOwner?: string;
  actionDescription?: string;
  evidence?: string;
  evidenceTimestamp?: string;
  lastMessage?: string;
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

function getStatusBadge(status: ClientStatus) {
  if (status === 'CRÍTICO') return 'bg-red-600/20 text-red-300 border-red-500/40';
  if (status === 'ALTO') return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  if (status === 'MÉDIO') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  return 'bg-green-500/20 text-green-300 border-green-500/40';
}

function getStatusAccent(status: ClientStatus) {
  if (status === 'CRÍTICO') return 'from-red-500/30 to-red-900/10';
  if (status === 'ALTO') return 'from-orange-500/30 to-orange-900/10';
  if (status === 'MÉDIO') return 'from-amber-500/30 to-amber-900/10';
  return 'from-green-500/30 to-green-900/10';
}

export default function AcoesPendentesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<PendingActionClient[]>([]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks/clients');
      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.data)) {
        const mapped = data.data
          .map((item: Record<string, unknown>): PendingActionClient => {
            const riskLevel = parseRiskLevel(item.score, item.riskLevel ?? item.risco);
            const status = riskLevel === 0 ? 'BAIXO' : normalizeStatus(item.status, riskLevel);

            return {
              id: String(item.id ?? item.Id ?? item.ID ?? ''),
              name: String(item.cliente ?? item.Cliente ?? item.client_name ?? item.name ?? 'Sem nome'),
              status,
              riskLevel,
              actionOwner: item.responsavel ? String(item.responsavel) : undefined,
              actionDescription: item.acaoRecomendada
                ? String(item.acaoRecomendada)
                : item.actionDescription
                ? String(item.actionDescription)
                : undefined,
              evidence: item.evidencia ? String(item.evidencia) : undefined,
              evidenceTimestamp: item.data_evidencia ? String(item.data_evidencia) : undefined,
              lastMessage: item.ultima_Mensagem ? String(item.ultima_Mensagem) : undefined,
            };
          })
          .filter((client: PendingActionClient) => client.id);

        setClients(mapped);
      }
    } catch (error) {
      console.error('[AcoesPendentes] Erro carregando clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const pendingClients = useMemo(() => {
    const highPriority = clients
      .filter((client) => client.status === 'CRÍTICO' || client.status === 'ALTO')
      .sort((a, b) => b.riskLevel - a.riskLevel);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return highPriority;

    return highPriority.filter((client) => {
      return (
        client.name.toLowerCase().includes(normalizedSearch) ||
        String(client.actionDescription || '').toLowerCase().includes(normalizedSearch) ||
        String(client.actionOwner || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [clients, searchTerm]);

  const criticalPending = pendingClients.filter((client) => client.status === 'CRÍTICO').length;
  const highPending = pendingClients.filter((client) => client.status === 'ALTO').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ações Pendentes</h1>
            <p className="text-slate-300 mt-1">Lista de clientes críticos e altos que exigem acompanhamento imediato.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadClients}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 text-slate-100 hover:bg-slate-700 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 text-slate-100 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao dashboard
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, ação ou responsável"
                className="w-full bg-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-600"
              />
            </div>
            <p className="text-sm text-slate-200">
              <span className="font-semibold text-white">{pendingClients.length}</span> ações pendentes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="rounded-xl bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-300">Total pendentes</p>
            <p className="text-2xl font-bold text-white mt-1">{pendingClients.length}</p>
          </div>
          <div className="rounded-xl bg-red-950/20 p-4">
            <p className="text-xs uppercase tracking-widest text-red-200">Crítico</p>
            <p className="text-2xl font-bold text-red-300 mt-1">{criticalPending}</p>
          </div>
          <div className="rounded-xl bg-orange-950/20 p-4">
            <p className="text-xs uppercase tracking-widest text-orange-200">Alto</p>
            <p className="text-2xl font-bold text-orange-300 mt-1">{highPending}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {pendingClients.map((client) => (
            <div
              key={client.id}
              className={`rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 shadow-lg ${getStatusAccent(client.status)}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white leading-tight break-words">{client.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadge(client.status)}`}>
                      {client.status}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-200">
                      <ShieldAlert className="w-3 h-3" />
                      Risco {client.riskLevel}%
                    </span>
                  </div>
                </div>
                <Link
                  href={`/?clientId=${client.id}`}
                  className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 whitespace-nowrap"
                  title="Abrir cliente no dashboard"
                >
                  Abrir
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mb-4">
                <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${client.status === 'CRÍTICO' ? 'bg-red-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.max(4, Math.min(100, client.riskLevel))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-lg bg-amber-950/20 p-4">
                  <p className="text-[11px] uppercase tracking-widest text-amber-300 font-semibold mb-1.5">Ação recomendada</p>
                  <p className="text-sm text-slate-100 leading-relaxed">
                    {client.actionDescription || client.lastMessage || 'Sem descrição de ação no momento.'}
                  </p>
                </section>

                <section className="rounded-lg bg-slate-800/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-100 text-sm">
                    <UserCircle2 className="w-4 h-4 text-slate-300" />
                    <span className="font-medium">Responsável:</span>
                    <span>{client.actionOwner || 'Não atribuído'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-200 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-300 flex-shrink-0" />
                    <p className="leading-relaxed">{client.evidence || 'Sem evidência registrada.'}</p>
                  </div>
                  <p className="text-xs text-slate-300">Última evidência: {client.evidenceTimestamp || 'Sem data'}</p>
                </section>
              </div>
            </div>
          ))}

          {!isLoading && pendingClients.length === 0 && (
            <div className="xl:col-span-2 rounded-xl bg-slate-900/60 p-8 text-center">
              <p className="text-slate-200 font-medium">Nenhuma ação pendente encontrada.</p>
              <p className="text-slate-300 text-sm mt-1">Ajuste os filtros ou atualize a listagem.</p>
            </div>
          )}

          {isLoading && (
            <div className="xl:col-span-2 rounded-xl bg-slate-900/60 p-8 text-center text-slate-200">
              Carregando ações pendentes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
