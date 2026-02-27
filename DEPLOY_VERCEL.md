# Deploy no Vercel - Guia Completo

Este guia explica como fazer o deploy 100% funcional da aplicação Cabuetia no Vercel.

## 🚀 Deploy Rápido

### 1. **Conectar ao Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

Ou via CLI:
```bash
npm install -g vercel
vercel login
vercel
```

### 2. **Configurar Variáveis de Ambiente**

No painel do Vercel ou via CLI, adicione:

```env
WEBHOOK_URL=https://n8n.aegmedia.com.br/webhook-test/seu-webhook-id
```

**Via Painel Vercel:**
1. Acesse seu projeto no Vercel
2. Settings → Environment Variables
3. Adicione `WEBHOOK_URL` com o valor do seu webhook n8n

**Via CLI:**
```bash
vercel env add WEBHOOK_URL
```

### 3. **Deploy**

```bash
vercel --prod
```

---

## ⚙️ Configurações Incluídas

### `vercel.json`
- ✅ Região: `gru1` (São Paulo, Brasil)
- ✅ Timeout de API: 10 segundos
- ✅ Headers CORS configurados
- ✅ Framework Next.js otimizado

### `next.config.ts`
- ✅ React Strict Mode
- ✅ SWC Minify para builds otimizados
- ✅ Variáveis de ambiente configuradas
- ✅ Headers CORS para desenvolvimento local

---

## 📡 Endpoints da API

Todos os endpoints da API funcionam perfeitamente no Vercel:

### ✅ **Send Message** (100% Funcional)
```
POST https://seu-projeto.vercel.app/api/webhooks/send-message
```
Envia mensagens para o webhook n8n configurado.

### ⚠️ **Conversations** (Storage Temporário)
```
POST/GET https://seu-projeto.vercel.app/api/webhooks/conversations
```
**ATENÇÃO:** Usa armazenamento em memória que não persiste entre requisições no Vercel.

### ⚠️ **Logs** (Storage Temporário)
```
POST/GET https://seu-projeto.vercel.app/api/webhooks/logs
```
**ATENÇÃO:** Logs são temporários e não persistem no Vercel.

### ✅ **Receive Response** (100% Funcional)
```
POST https://seu-projeto.vercel.app/api/webhooks/receive-response
```
Recebe webhooks externos perfeitamente.

---

## 🗄️ Persistência de Dados no Vercel

### Problema
O Vercel usa **funções serverless stateless**. Cada requisição pode rodar em um container diferente, então:
- ❌ Variáveis `let` globais não persistem
- ❌ Dados em memória são perdidos entre requisições
- ❌ Storage em memória não funciona para produção

### Soluções Recomendadas

#### 1. **Vercel KV** (Redis) - Recomendado para Cache
```bash
npm install @vercel/kv
```

```typescript
import { kv } from '@vercel/kv';

// Salvar conversa
await kv.set(`conversation:${clientId}`, conversationData);

// Buscar conversa
const conversation = await kv.get(`conversation:${clientId}`);
```

**Vantagens:**
- ✅ Integração nativa com Vercel
- ✅ Muito rápido (Redis)
- ✅ Grátis até 256 MB
- ✅ Ideal para cache e sessões

#### 2. **MongoDB Atlas** - Recomendado para Histórico
```bash
npm install mongodb
```

```typescript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('cabuetia');
const conversations = db.collection('conversations');
```

**Vantagens:**
- ✅ Histórico completo e permanente
- ✅ Queries avançadas
- ✅ Free tier generoso (512 MB)
- ✅ Ideal para analytics

#### 3. **Supabase** - Alternativa Completa
```bash
npm install @supabase/supabase-js
```

**Vantagens:**
- ✅ PostgreSQL gerenciado
- ✅ Real-time subscriptions
- ✅ Auth integrado
- ✅ Storage de arquivos

---

## 🔧 Configurações Avançadas

### Alterar Região
Edite `vercel.json`:
```json
{
  "regions": ["gru1"]  // São Paulo
  // Outras opções: "iad1" (US East), "cdg1" (Paris), "hnd1" (Tokyo)
}
```

### Aumentar Timeout
Plano Pro permite até 60 segundos:
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Variáveis de Ambiente por Ambiente
```bash
# Produção
vercel env add WEBHOOK_URL production

# Preview
vercel env add WEBHOOK_URL preview

# Development
vercel env add WEBHOOK_URL development
```

---

## 🧪 Testar Localmente

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Baixar Variáveis de Ambiente
```bash
vercel env pull .env.local
```

### 3. Rodar Localmente
```bash
vercel dev
```

Isso simula o ambiente Vercel localmente, incluindo:
- ✅ Funções serverless
- ✅ Variáveis de ambiente
- ✅ Edge Functions
- ✅ Rewrites e headers

---

## 📊 Monitoramento

### Logs em Tempo Real
```bash
vercel logs --follow
```

### Analytics
Acesse: `https://vercel.com/seu-usuario/seu-projeto/analytics`

### Métricas Disponíveis:
- ✅ Requisições por endpoint
- ✅ Tempo de resposta
- ✅ Taxa de erro
- ✅ Uso de bandwidth

---

## 🐛 Troubleshooting

### Erro: "WEBHOOK_URL is not defined"
```bash
# Adicionar via CLI
vercel env add WEBHOOK_URL

# Ou no painel: Settings → Environment Variables
```

### Erro: "Function execution timed out"
- Aumente o `maxDuration` em `vercel.json`
- No plano gratuito, máximo é 10 segundos

### Dados não persistem
- Use Vercel KV, MongoDB ou Supabase
- Storage em memória não funciona no Vercel

### CORS Errors
- Já configurado em `vercel.json` e `next.config.ts`
- Se persistir, adicione domínio específico no CORS

---

## 🎯 Checklist de Deploy

- [ ] Variável `WEBHOOK_URL` configurada
- [ ] Build local funciona: `npm run build`
- [ ] Testes de API funcionando
- [ ] Webhook n8n configurado para receber
- [ ] Deploy realizado: `vercel --prod`
- [ ] Testes de endpoints após deploy
- [ ] Monitoramento ativo

---

## 📚 Recursos

- [Documentação Vercel](https://vercel.com/docs)
- [Next.js na Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## 💡 Dicas de Otimização

1. **Use Edge Functions para latência ultra-baixa**
   ```typescript
   export const runtime = 'edge';
   ```

2. **Implemente cache agressivo**
   ```typescript
   export const revalidate = 60; // Revalidar a cada 60s
   ```

3. **Monitore custos**
   - 100GB bandwidth grátis/mês
   - Após isso, $40/TB

4. **Use ISR para conteúdo dinâmico**
   ```typescript
   export const revalidate = 3600; // 1 hora
   ```

---

## ✅ Status de Funcionalidades

| Endpoint | Status | Observação |
|----------|--------|------------|
| Send Message | ✅ 100% | Funciona perfeitamente |
| Receive Response | ✅ 100% | Recebe webhooks externos |
| Conversations | ⚠️ Temporário | Precisa de banco de dados |
| Logs | ⚠️ Temporário | Precisa de banco de dados |
| Dashboard | ✅ 100% | Interface funciona perfeitamente |
| Chat UI | ✅ 100% | Envio de mensagens funcional |

---

**🎉 Pronto! Sua aplicação está configurada para funcionar 100% no Vercel!**

Para persistência completa, siga as instruções de integração com Vercel KV ou MongoDB Atlas acima.
