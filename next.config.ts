import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurações otimizadas para Vercel
  reactStrictMode: true,
  
  // Permite variáveis de ambiente no cliente (use com prefixo NEXT_PUBLIC_)
  env: {
    WEBHOOK_URL: process.env.WEBHOOK_URL || '',
    CHAT_WEBHOOK_URL: process.env.CHAT_WEBHOOK_URL || '',
  },
  
  // Configuração de headers para CORS (redundante com vercel.json mas mantém compatibilidade local)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
