# ⚡ AÇÃO NECESSÁRIA - Webhook n8n

## ❌ Problema
O webhook não está respondendo (TIMEOUT).

## ✅ Servidor n8n
**Status:** ONLINE ✅  
**URL:** https://n8n.aegmedia.com.br

## ⚠️ Causa
O **workflow não está ativo** no n8n ou o webhook path está incorreto.

---

## 🔧 SOLUÇÃO RÁPIDA

### 1. Acesse o n8n
```
https://n8n.aegmedia.com.br
```

### 2. Encontre o Workflow
Procure pelo workflow que tem este webhook:
```
0021ec91-5f4b-4168-9b68-b6e1cd9caddf
```

### 3. ATIVE o Workflow
- Toggle no canto superior direito → **VERDE**
- Clique em **Save**

### 4. Teste
Execute no terminal:
```powershell
.\test-webhook-simple.ps1
```

**Resultado esperado:**
```
STATUS: 200
SUCESSO! Webhook esta funcionando!
```

---

## 🆘 Se Não Encontrar o Workflow

### Criar Novo Webhook no n8n:

1. **Novo Workflow** → Adicionar node → **Webhook**
2. Configure:
   - Method: `POST`
   - Path: Deixe auto-gerar
   - Response Mode: `Immediately`
3. **Ative** o workflow (toggle verde)
4. **Copie a URL** completa gerada
5. **Atualize** o `.env`:
   ```env
   WEBHOOK_URL=sua-nova-url-aqui
   ```

---

## 📋 Alternativa Temporária

Se não conseguir ativar agora, comente a linha no `.env`:

```env
# WEBHOOK_URL=https://n8n.aegmedia.com.br/webhook-test/0021ec91-5f4b-4168-9b68-b6e1cd9caddf
```

A aplicação funcionará normalmente, só não enviará para n8n.

---

**📚 Documentação Completa:** [TROUBLESHOOTING_N8N.md](TROUBLESHOOTING_N8N.md)
