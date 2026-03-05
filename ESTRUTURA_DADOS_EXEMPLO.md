# Estrutura de Dados - Exemplo Real

Este documento mostra a estrutura de dados esperada baseada nos CSVs reais do banco de dados.

## Tabela: Clientes_Database

| Campo | Tipo | Exemplo | Descrição |
|-------|------|---------|-----------|
| id | string | `120363403734753852@g.us` | Identificador único do cliente |
| Cliente | string | `BSB` | Nome do cliente |
| Afivo | boolean | `true` | Status ativo/inativo |
| Dashboard | string | `120363400854300002@g.us` | **Chave de ligação com ChurnDashboard** |
| Suporte | string | `16608292000180` | ID de suporte |
| clickup | string | `86b75ayg4` | ID do ClickUp |

## Tabela: ChurnDashboard

| Campo | Tipo | Exemplo | Descrição |
|-------|------|---------|-----------|
| id | number | `37` | ID do registro |
| created_at | timestamp | `2026-03-03 13:54:11.098047+00` | Data de criação |
| cliente | string | `Nordeste Clube` | Nome do cliente no relatório |
| status | string | `🟠 ALTO` | Status de risco |
| score | number | `40` | Pontuação de risco (0-100) |
| tendencia | string | `➡️ Estável` | Tendência do risco |
| detrator | string | `Acesso/Configuração técnica pendente...` | Principal detrator |
| evidencia | string | `02/03/2026, 09:26 Ultima Mensagem...` | Evidência do risco |
| acaoRecomendada | string | `Lucas deve verificar...` | Ação recomendada |
| chat_id | string | `120363400854300002@g.us` | **Chave de ligação com Clientes_Database.Dashboard** |
| squad | string | `Zeus` | Squad responsável |
| responsavel | string | `Lucas Albuquerque (AEG)` | Responsável pela ação |
| data_evidencia | string | `02/03/2026, 09:26` | Data da evidência |
| ultima_Mensagem | string | `Lucas Albuquerque: "Andreia..."` | Última mensagem do chat |

## Lógica de Matching

```typescript
// Clientes_Database.Dashboard DEVE SER IGUAL ChurnDashboard.chat_id
Clientes_Database.Dashboard === ChurnDashboard.chat_id

// Exemplo do seu banco:
"120363400854300002@g.us" === "120363400854300002@g.us" ✅
```

## Sempre Usar o Relatório Mais Recente

```sql
ORDER BY created_at DESC LIMIT 1 PER chat_id
```

Se existirem múltiplos relatórios para o mesmo `chat_id`, sempre usar o com `created_at` mais recente.

## Estrutura Retornada pelo Endpoint

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "120363403734753852@g.us",
      "cliente": "BSB",
      "cliente_churn": "Nordeste Clube",
      "chat_id": "120363400854300002@g.us",
      "status": "🟠 ALTO",
      "score": 40,
      "tendencia": "➡️ Estável",
      "squad": "Zeus",
      "responsavel": "Lucas Albuquerque (AEG)",
      "detrator": "Acesso/Configuração técnica pendente (Hospedagem / Tag Manager / Data de ativação)",
      "evidencia": "02/03/2026, 09:26\nUltima Mensagem: Lucas Albuquerque: \"Andreia, ... vou precisar do acesso a hospedagem. ... também me passe o login e senha do google ai de vocês pra fazer a configuração da Tag Manager.\"\nEvidencia: Lucas Albuquerque solicitou acessos de hospedagem e Google para configurar o Tag Manager. Não há confirmação de ativação ou go-live após o pedido do cliente.",
      "acaoRecomendada": "Lucas deve verificar e solicitar acessos para configurar o Tag Manager, agendando a ativação e monitorando a chegada de leads.",
      "data_evidencia": "02/03/2026, 09:26",
      "ultima_Mensagem": "Lucas Albuquerque: \"Andreia, ... vou precisar do acesso a hospedagem. ... também me passe o login e senha do google ai de vocês pra fazer a configuração da Tag Manager.\"",
      "Dashboard": "120363400854300002@g.us",
      "email": null,
      "phone": null
    }
  ]
}
```

## Frontend Mapping (DashboardLayout.tsx)

O componente frontend mapeia os dados da API para a interface:

```typescript
{
  id: "120363403734753852@g.us",           // de Clientes_Database
  name: "BSB",                              // de Clientes_Database.Cliente
  status: "ALTO",                           // normalizado do ChurnDashboard
  riskLevel: 40,                            // de ChurnDashboard.score
  chatId: "120363400854300002@g.us",       // de ChurnDashboard.chat_id
  trend: "Estável",                         // normalizado de tendencia
  squad: "Zeus",                            // de ChurnDashboard.squad
  detractor: "Acesso/Configuração...",     // de ChurnDashboard.detrator
  evidence: "02/03/2026, 09:26...",        // de ChurnDashboard.evidencia
  evidenceTimestamp: "02/03/2026, 09:26",  // de ChurnDashboard.data_evidencia
  actionOwner: "Lucas Albuquerque (AEG)",  // de ChurnDashboard.responsavel
  actionDescription: "Lucas deve...",      // de ChurnDashboard.acaoRecomendada
  lastMessage: "Lucas Albuquerque...",     // de ChurnDashboard.ultima_Mensagem
  cliente_churn: "Nordeste Clube"          // de ChurnDashboard.cliente
}
```

## Como Validar

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acesse o endpoint diretamente:**
   ```
   http://localhost:3000/api/webhooks/clients
   ```

3. **Verifique o console do terminal** para ver o log de validação:
   ```
   ========== VALIDAÇÃO ENDPOINT /api/webhooks/clients ==========
   Total de clientes: 1
   Primeiro cliente: { ... dados completos ... }
   ==============================================================
   ```

4. **Verifique o dashboard frontend** em `http://localhost:3000`
   - O cliente "BSB" deve aparecer na listagem
   - Status: ALTO (🟠)
   - Score: 40
   - Squad: Zeus
   - Responsável: Lucas Albuquerque (AEG)

## Troubleshooting

### Cliente não aparece na lista

1. Verifique se `Clientes_Database.Dashboard` tem valor e corresponde a algum `ChurnDashboard.chat_id`
2. Confirme que o campo `id` em `Clientes_Database` não está nulo
3. Verifique os logs do terminal para ver se há erros de conexão com Supabase

### Dados do relatório não aparecem

1. Confirme que existe um registro em `ChurnDashboard` com `chat_id = 120363400854300002@g.us`
2. Verifique se o campo `created_at` está preenchido no ChurnDashboard
3. Veja os logs do terminal mostrando o match entre Dashboard e chat_id

### Status/Score incorretos

1. Verifique se o campo `score` no ChurnDashboard está como número (40, não "40")
2. Confirme a normalização do status no frontend (parseRiskLevel + normalizeStatus)
