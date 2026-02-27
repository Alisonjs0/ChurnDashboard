# 🔧 Troubleshooting - Conexão n8n

## ❌ Problema Detectado

O webhook n8n não está respondendo (timeout após 10 segundos).

```
URL: https://n8n.aegmedia.com.br/webhook-test/0021ec91-5f4b-4168-9b68-b6e1cd9caddf
Erro: O tempo limite da operação foi atingido
```

---

## 🔍 Checklist de Diagnóstico

### 1. Verificar o n8n

Acesse o painel do n8n:
- **URL:** https://n8n.aegmedia.com.br
- **Login:** Use suas credenciais

### 2. Verificar o Workflow

No n8n, verifique se:
- [ ] O workflow está **ATIVO** (botão toggle verde)
- [ ] O webhook node está configurado corretamente
- [ ] A URL do webhook está correta: `0021ec91-5f4b-4168-9b68-b6e1cd9caddf`
- [ ] Não há erros no workflow

### 3. Testar o Webhook Manualmente no n8n

1. Abra o workflow no n8n
2. Clique em "Execute Workflow"
3. No webhook node, clique em "Listen for test event"
4. Execute o script de teste novamente

### 4. Verificar Logs do n8n

No painel do n8n:
1. Vá em "Executions"
2. Verifique se há execuções recentes
3. Veja se há erros nos logs

---

## 🚀 Como Reativar o Webhook

### No n8n:

1. **Abra o workflow** que contém o webhook
2. **Verifique o Webhook Node:**
   - Path: `/0021ec91-5f4b-4168-9b68-b6e1cd9caddf`
   - Method: `POST`
   - Response Mode: `Immediately` ou `When Last Node Finishes`

3. **Ative o workflow:**
   - Toggle no canto superior direito deve estar **VERDE**
   
4. **Salve as alterações**

### Testar Novamente:

Execute o script de teste:
```powershell
.\test-webhook-simple.ps1
```

Ou via API (com servidor rodando):
```bash
npm run dev
# Em outro terminal:
curl http://localhost:3000/api/webhooks/test
```

---

## 🔄 Alternativas Enquanto o n8n Está Indisponível

### 1. Usar Webhook Público (Webhook.site)

Crie um webhook temporário em: https://webhook.site

No `.env`:
```env
WEBHOOK_URL=https://webhook.site/seu-id-aqui
```

### 2. Desabilitar Webhook Temporariamente

Comente a variável no `.env`:
```env
# WEBHOOK_URL=https://n8n.aegmedia.com.br/webhook-test/0021ec91-5f4b-4168-9b68-b6e1cd9caddf
```

A aplicação funcionará normalmente, apenas não enviará para n8n.

---

## 📊 Testar Status do Servidor n8n

### Via PowerShell:
```powershell
# Testar se o servidor está online
Test-NetConnection -ComputerName n8n.aegmedia.com.br -Port 443

# Testar HTTP
Invoke-WebRequest -Uri "https://n8n.aegmedia.com.br" -Method GET -TimeoutSec 5
```

### Via Browser:
Acesse: https://n8n.aegmedia.com.br

Se não carregar, o servidor está offline.

---

## 🛠️ Criar Novo Webhook no n8n

Se precisar criar um novo webhook:

1. **No n8n**, crie um novo workflow
2. **Adicione um Webhook node**
3. Configure:
   - **HTTP Method:** POST
   - **Path:** Deixe auto-gerar ou defina um custom
   - **Response Mode:** Immediately
4. **Ative o workflow**
5. **Copie a URL** gerada
6. **Atualize o `.env`** com a nova URL

---

## ✅ Verificação Final

Após reativar o n8n, execute:

```powershell
# Teste 1: Direto
.\test-webhook-simple.ps1

# Teste 2: Via API (com npm run dev rodando)
npm run dev
# Em outro terminal:
curl http://localhost:3000/api/webhooks/test
```

**Resultado esperado:**
```
STATUS: 200
RESPOSTA: OK
SUCESSO! Webhook esta funcionando!
```

---

## 📞 Suporte

Se o problema persistir:
1. Verifique com o administrador do servidor n8n
2. Confirme que o domínio `n8n.aegmedia.com.br` está acessível
3. Verifique configurações de firewall/proxy

---

## 🔗 Links Úteis

- [Documentação n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Troubleshooting](https://docs.n8n.io/hosting/troubleshooting/)
- [Webhook Testing Tool](https://webhook.site)
