# Atualização do Dashboard de Gestão de Risco de Churn

## Data: 03/03/2026

Este documento descreve como os dados do CSV "Chrun Dashboard_rows.csv" foram integrados ao sistema.

## Estrutura de Dados

### 1. Arquivo `clients.ts`
Contém a lista simplificada de clientes com informações básicas:
- **id**: Identificador único do cliente
- **name**: Nome do cliente/empresa
- **status**: Nível de risco (CRÍTICO, ALTO, MÉDIO, BAIXO)
- **riskLevel**: Percentual de risco (0-100)
- **lastMessage**: Última mensagem relevante do cliente
- **lastMessageTime**: Data da última interação
- **email/phone**: Dados de contato

### 2. Arquivo `churn-data.ts`
Contém os dados detalhados de análise de risco para cada cliente:
- **id**: Identificador único (corresponde ao ID em clients.ts)
- **chatId**: ID do chat do WhatsApp
- **createdAt**: Data de criação do registro
- **clientName**: Nome do cliente
- **riskLevel**: Percentual de risco
- **status**: Nível de risco (CRÍTICO, ALTO, MÉDIO, BAIXO)
- **trend**: Tendência ('Piorando', 'Estável', 'Melhorando')
- **squad**: Equipe responsável
- **detractor**: Principal fator de risco identificado
- **evidence**: Evidências e contexto do risco
- **evidenceTimestamp**: Data/hora da evidência
- **actionOwner**: Responsável pela ação corretiva
- **actionDescription**: Descrição da ação recomendada

## Interpretação do RiskLevel

O sistema utiliza uma lógica invertida onde:
- **Score baixo (0-30%)** = **RISCO CRÍTICO** ⚠️
  - Cliente em situação muito grave, alto risco de churn
  
- **Score médio-baixo (30-50%)** = **RISCO ALTO** 🟠
  - Cliente com problemas significativos, atenção imediata necessária
  
- **Score médio (50-70%)** = **RISCO MÉDIO** 🟡
  - Cliente com algumas preocupações, monitoramento necessário
  
- **Score alto (70-100%)** = **RISCO BAIXO** 🟢
  - Cliente saudável, baixo risco de churn

## Clientes Atualizados

### Clientes Críticos (Risk Level < 30%)
1. **(MCI PLUS) AEG MEDIA / Nordeste Clube** - 20%
   - Problema: Discrepância no Meta (80% das conversas não existem)
   
2. **(MCI PLUS) Auto Energia Baterias** - 10% 
   - Problema: Inadimplência/Bloqueio de campanha

3. **(MCI PLUS) Nordeste Clube** - 10%
   - Problema: Falhas técnicas na contabilização de mensagens

### Clientes Alto Risco (30-50%)
4. **Belloscar <> AEG** - 35%
   - Problema: API não conectada
   
5. **COMERCIAL INTERNO - SC CLUBE** - 30%
   - Problema: Atraso operacional

### Clientes Médio Risco (50-70%)
6. **Auto X Veículos** - 60%
7. **Primos Protege** - 60%
8. **[MCI PLUS] AEG <> MARTOLI** - 50%
9. **[MCI FULL] Cansadão Automóveis** - 50%
10. **MCI PLUS - auto x veículos** - 50%

### Clientes Baixo Risco (70-100%)
11. **Unimais <> AEG** - 85%

## Como Usar

### Visualização de Cliente Individual
1. Clique em qualquer cliente na barra lateral esquerda
2. O card de risco detalhado será exibido mostrando:
   - Nível de risco visual (gauge)
   - Tendência (Piorando ⬆️, Estável ➡️, Melhorando ⬇️)
   - Squad responsável
   - Detrator principal
   - Evidências com timestamp
   - Ação recomendada e responsável

### Dashboard Geral
- Quando nenhum cliente está selecionado, o dashboard mostra:
  - Total de clientes
  - Nível de risco médio
  - Percentual em risco
  - Distribuição por nível de risco
  - Atividades recentes

## Próximos Passos

1. ✅ Dados do CSV integrados
2. ✅ Interface atualizada com dados reais
3. 🔄 Conectar com API do Supabase para dados em tempo real
4. 🔄 Adicionar histórico de alterações de status
5. 🔄 Implementar notificações automáticas para riscos críticos

## Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones

---
**Última atualização:** 03/03/2026
**Responsável:** Sistema de Gestão de Churn
