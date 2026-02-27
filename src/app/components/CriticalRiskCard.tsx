'use client';

import React from 'react';
import { AlertCircle, TrendingUp, AlertTriangle, Clock, CheckCircle, AlertOctagon } from 'lucide-react';

export interface CriticalRiskCardProps {
  clientName: string;
  riskLevel: number;
  status: 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
  trend: 'Piorando' | 'Estável' | 'Melhorando';
  squad: string;
  detractor: string;
  evidence: string;
  evidenceTimestamp: string;
  actionOwner: string;
  actionDescription: string;
}

const CriticalRiskCard: React.FC<CriticalRiskCardProps> = ({
  clientName,
  riskLevel,
  status,
  trend,
  squad,
  detractor,
  evidence,
  evidenceTimestamp,
  actionOwner,
  actionDescription,
}) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (riskLevel / 100) * circumference;

  const statusColors: Record<string, string> = {
    CRÍTICO: 'from-red-600 to-red-700',
    ALTO: 'from-orange-500 to-orange-600',
    MÉDIO: 'from-amber-500 to-amber-600',
    BAIXO: 'from-green-500 to-green-600',
  };

  const trendColors: Record<string, { icon: string; arrow: string }> = {
    Piorando: { icon: 'text-red-500', arrow: '↑' },
    Estável: { icon: 'text-amber-500', arrow: '→' },
    Melhorando: { icon: 'text-green-500', arrow: '↓' },
  };

  // Status icon selector
  const getStatusIcon = () => {
    switch (status) {
      case 'CRÍTICO':
        return { Icon: AlertOctagon, color: 'bg-red-600', bgColor: 'text-red-600' };
      case 'ALTO':
        return { Icon: AlertTriangle, color: 'bg-orange-500', bgColor: 'text-orange-500' };
      case 'MÉDIO':
        return { Icon: AlertCircle, color: 'bg-amber-500', bgColor: 'text-amber-500' };
      case 'BAIXO':
        return { Icon: CheckCircle, color: 'bg-green-500', bgColor: 'text-green-500' };
      default:
        return { Icon: AlertCircle, color: 'bg-slate-500', bgColor: 'text-slate-500' };
    }
  };

  const { Icon: StatusIcon, color: iconBgColor } = getStatusIcon();

  // Dynamic gauge colors based on risk level
  const getGaugeColors = (level: number) => {
    if (level <= 25) {
      return {
        startColor: '#22c55e', // green-500
        endColor: '#16a34a',   // green-600
        textColor: 'text-green-500',
      };
    } else if (level <= 50) {
      return {
        startColor: '#eab308', // yellow-500
        endColor: '#ca8a04',   // yellow-600
        textColor: 'text-yellow-500',
      };
    } else if (level <= 75) {
      return {
        startColor: '#f97316', // orange-500
        endColor: '#ea580c',   // orange-600
        textColor: 'text-orange-500',
      };
    } else {
      return {
        startColor: '#dc2626', // red-600
        endColor: '#7f1d1d',   // red-900
        textColor: 'text-red-500',
      };
    }
  };

  const gaugeColors = getGaugeColors(riskLevel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
      <style jsx>{`
        @keyframes pulse-alert {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.6);
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 40px rgba(220, 38, 38, 0.3);
          }
        }
        .pulse-alert {
          animation: pulse-alert 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Gestão de Risco de Churn
          </h1>
          <div className="text-right">
            <p className="text-sm text-slate-400">Data do Relatório</p>
            <p className="text-lg font-semibold text-white">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          {/* Status Bar */}
          <div
            className={`bg-gradient-to-r ${statusColors[status]} p-6 flex items-center justify-between`}
          >
            <div className="flex items-center gap-4">
              <div className={`pulse-alert ${iconBgColor} rounded-full p-3`}>
                <StatusIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-white text-sm font-semibold tracking-widest uppercase">
                  Status
                </h2>
                <p className="text-3xl font-bold text-white">{status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-sm opacity-90">Cliente</p>
              <p className="text-xl font-bold text-white">{clientName}</p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Health Score Gauge */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(71, 85, 105, 0.3)"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#riskGradient)"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dashoffset 1s ease-out',
                      }}
                    />
                    <defs>
                      <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gaugeColors.startColor} />
                        <stop offset="100%" stopColor={gaugeColors.endColor} />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-bold ${gaugeColors.textColor}`}>{riskLevel}%</span>
                    <span className="text-sm text-slate-400 mt-2">Risk Level</span>
                  </div>
                </div>

                {/* Trend Indicator */}
                <div className="bg-slate-700/50 rounded-lg p-4 w-full text-center border border-slate-600">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Tendência</p>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`text-3xl font-bold ${
                        trendColors[trend]?.icon || 'text-slate-400'
                      }`}
                    >
                      {trendColors[trend]?.arrow}
                    </span>
                    <span className="text-xl font-semibold text-white">{trend}</span>
                  </div>
                </div>
              </div>

              {/* Data Points and Evidence */}
              <div className="lg:col-span-2">
                {/* Data Points */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* Squad */}
                  <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-amber-500/50 transition-colors">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-3 font-semibold">
                      Squad
                    </p>
                    <p className="text-lg font-bold text-white break-words">{squad}</p>
                  </div>

                  {/* Detractor */}
                  <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:border-red-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                        Detrator
                      </p>
                    </div>
                    <p className="text-lg font-bold text-white break-words">{detractor}</p>
                  </div>
                </div>

                {/* Evidence Box */}
                <div className="bg-gradient-to-br from-red-950/40 to-slate-900 border-2 border-red-900/50 rounded-lg p-6 relative overflow-hidden">
                  <div className="shimmer absolute inset-0" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">
                        Evidência
                      </h3>
                    </div>
                    <blockquote className="text-white italic mb-4 text-base leading-relaxed">
                      "{evidence}"
                    </blockquote>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{evidenceTimestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Banner */}
            <div className="bg-gradient-to-r from-amber-950/60 to-red-950/60 border-2 border-amber-600/40 rounded-lg p-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500/20 rounded-full p-3 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-2">
                    Próximo Passo - Ação Recomendada
                  </h3>
                  <p className="text-white font-semibold mb-2">
                    Action Owner: <span className="text-amber-300">{actionOwner}</span>
                  </p>
                  <p className="text-slate-200 text-base">{actionDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Dashboard de Gestão de Risco • Atualizado em tempo real</p>
        </div>
      </div>
    </div>
  );
};

export default CriticalRiskCard;
