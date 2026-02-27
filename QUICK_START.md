# 🚀 Guia Rápido - Deploy no Vercel

## ⚡ Deploy em 3 Passos

### 1. Instale a CLI do Vercel
```bash
npm install -g vercel
```

### 2. Faça Login
```bash
vercel login
```

### 3. Deploy!
```bash
vercel --prod
```

## 🔑 Adicionar Variável de Ambiente

### Via Interface Web:
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **Environment Variables**
4. Adicione:
   - **Nome:** `WEBHOOK_URL`
   - **Valor:** `https://n8n.aegmedia.com.br/webhook-test/seu-webhook-id`
5. Clique em **Save**

### Via CLI:
```bash
vercel env add WEBHOOK_URL
# Cole a URL quando solicitado
```

## ✅ Testar Deploy

Após o deploy, teste os endpoints:

```bash
# Substitua YOUR-PROJECT.vercel.app pelo seu domínio
curl -X POST https://YOUR-PROJECT.vercel.app/api/webhooks/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "1",
    "clientName": "Teste",
    "message": "Testando deploy!",
    "sender": "support",
    "senderName": "Suporte"
  }'
```

## 📊 Ver Logs em Tempo Real

```bash
vercel logs --follow
```

## 🔄 Redeploy após Mudanças

```bash
git add .
git commit -m "suas mudanças"
git push

# Vercel faz deploy automático após push no Git
# Ou force manualmente:
vercel --prod
```

## 🌍 Seu Domínio Vercel

Após o deploy, seu projeto estará disponível em:
```
https://seu-projeto.vercel.app
```

### Endpoints da API:
- `https://seu-projeto.vercel.app/api/webhooks/send-message`
- `https://seu-projeto.vercel.app/api/webhooks/receive-response`
- `https://seu-projeto.vercel.app/api/webhooks/conversations`
- `https://seu-projeto.vercel.app/api/webhooks/logs`

## 🎯 Dica Pro

Para ter um domínio customizado:
1. Acesse: Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

## ❓ Problemas Comuns

### Erro: "WEBHOOK_URL is not defined"
→ Adicione a variável de ambiente no painel do Vercel

### Erro: "Build failed"
→ Rode localmente primeiro: `npm run build`

### Dados não persistem
→ Normal! Use Vercel KV ou MongoDB para persistência
→ Veja: [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md#-persistência-de-dados-no-vercel)

---

**✨ Pronto! Seu dashboard está no ar!**

Para mais detalhes, consulte: [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)
