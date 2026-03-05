import { getSupabaseServerClient } from '@/lib/supabase-server';

const MESSAGES_TABLE = 'Churn Dashboard | Messages';
const CLIENTS_TABLE = 'Clientes_Database';
const CHURN_DASHBOARD_TABLE = 'ChurnDashboard';
const WEBHOOK_EVENTS_TABLE = 'webhook_events';
const CLIENTS_TABLE_CANDIDATES = [
  // Primary attempts
  CLIENTS_TABLE,
  'clientes_database',
  'ClientesDatabase',
  'dashClientes',
  'dashclientes',
  'DashClientes',
  'dash_clientes',
  'clientes',
  'clients',
  // Old fallbacks
  'Churn Dashboard',
  'Churn Dashboarde',
  'churn_dashboard',
];
const CHURN_DASHBOARD_TABLE_CANDIDATES = [
  CHURN_DASHBOARD_TABLE,
  'Churn Dashboard',
  'Chrun Dashboard',  // Variação com typo do arquivo CSV
  'ChrunDashboard',
  'churndashboard',
  'chrundashboard',
  'churn_dashboard',
  'chrun_dashboard',
  'churn dashboard',
  'chrun dashboard',
];

type SenderType = 'support' | 'client' | 'system';
type MessageStatus = 'sent' | 'received' | 'failed';

export interface ConversationMessageInput {
  messageId?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  sender: SenderType;
  senderName: string;
  message: string;
  timestamp?: string;
  type?: 'message' | 'note' | 'alert';
  status?: MessageStatus;
  error?: string;
  source?: string;
  direction?: 'outbound' | 'inbound' | 'internal';
  webhookStatus?: number | null;
  metadata?: Record<string, unknown>;
}

export interface WebhookEventInput {
  type: 'sent' | 'received' | 'error';
  clientId: string;
  clientName: string;
  endpoint: string;
  status: number | string;
  source?: string;
  messageId?: string;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: string;
}

function createInternalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  
  const code = (error as any)?.code;
  return code === '42P01';
}

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  
  const code = (error as any)?.code;
  const message = (error as any)?.message;

  return code === '42703' || code === 'PGRST204' || (message && String(message).includes('does not exist'));
}

function getRowValue(row: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return fallback;
}

function getRowNumberValue(row: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null || value === '') continue;

    const normalized = String(value).replace('%', '').replace(',', '.').trim();
    const parsed = Number(normalized);

    if (!Number.isNaN(parsed)) return parsed;
  }

  return fallback;
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase();
}

function extractChatIdentifier(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const normalized = normalizeLookupValue(value);
  if (!normalized) return null;

  const gUsMatch = normalized.match(/[0-9]{8,}@g\.us/);
  if (gUsMatch?.[0]) return gUsMatch[0];

  const digitsMatch = normalized.match(/[0-9]{8,}/);
  if (digitsMatch?.[0]) return digitsMatch[0];

  return normalized;
}

function getRowChatId(row: Record<string, unknown>) {
  return getRowValue(row, ['chat_id', 'chatId', 'chatid', 'ChatID', 'chat', 'Dashboard', 'dashboard']);
}

function getClientDashboardValue(row: Record<string, unknown>) {
  return getRowValue(row, ['Dashboard', 'dashboard', 'DASHBOARD', 'chat_id', 'chatId', 'ChatID', 'chat']);
}

function mapClientsBaseRows(clientsRows: Record<string, unknown>[]) {
  return clientsRows.map((clientRow) => {
    const dashboardKey = getClientDashboardValue(clientRow);
    const fallbackClientName = getRowValue(clientRow, ['cliente', 'Cliente', 'name', 'client_name'], 'Sem nome');

    return {
      ...clientRow,
      id: getRowValue(clientRow, ['id', 'Id', 'ID'], dashboardKey || createInternalId('client')),
      cliente: fallbackClientName,
      chat_id: dashboardKey,
      status: getRowValue(clientRow, ['status'], ''),
      score: getRowNumberValue(clientRow, ['score', 'riskLevel'], 0),
      tendencia: getRowValue(clientRow, ['tendencia', 'trend'], ''),
      squad: getRowValue(clientRow, ['squad'], 'Não atribuído'),
      responsavel: getRowValue(clientRow, ['responsavel', 'actionOwner'], 'Não atribuído'),
      detrator: getRowValue(clientRow, ['detrator', 'detractor'], 'Não identificado'),
      evidencia: getRowValue(clientRow, ['evidencia', 'evidence'], 'Análise pendente'),
      acaoRecomendada: getRowValue(clientRow, ['acaoRecomendada', 'acao_recomendada', 'actionDescription'], 'Aguardando análise inicial'),
      data_evidencia: getRowValue(clientRow, ['data_evidencia', 'evidenceTimestamp']),
      ultima_Mensagem: getRowValue(clientRow, ['ultima_Mensagem', 'lastMessage']),
      created_at: getRowCreatedAt(clientRow),
      email: getRowValue(clientRow, ['email', 'Email']),
      phone: getRowValue(clientRow, ['phone', 'telefone', 'Phone']),
      Dashboard: dashboardKey,
    };
  });
}

function getRowCreatedAt(row: Record<string, unknown>) {
  return getRowValue(row, ['created_at', 'createdAt', 'data_criacao']);
}

function getLatestChurnRowsByChatId(rows: Record<string, unknown>[]) {
  const latestRowsByChatId = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const chatId = getRowChatId(row);
    if (!chatId) continue;

    const normalizedChatId = extractChatIdentifier(chatId);
    if (!normalizedChatId) continue;

    const current = latestRowsByChatId.get(normalizedChatId);

    if (!current) {
      latestRowsByChatId.set(normalizedChatId, row);
      continue;
    }

    const currentTimestamp = Date.parse(getRowCreatedAt(current));
    const candidateTimestamp = Date.parse(getRowCreatedAt(row));

    if (Number.isNaN(currentTimestamp) || Number.isNaN(candidateTimestamp)) {
      const currentCreatedAt = getRowCreatedAt(current);
      const candidateCreatedAt = getRowCreatedAt(row);

      if (candidateCreatedAt > currentCreatedAt) {
        latestRowsByChatId.set(normalizedChatId, row);
      }
      continue;
    }

    if (candidateTimestamp > currentTimestamp) {
      latestRowsByChatId.set(normalizedChatId, row);
    }
  }

  return latestRowsByChatId;
}

function normalizeMessageRow(row: Record<string, unknown>) {
  return {
    id: getRowValue(row, ['id'], createInternalId('msg')),
    message_id: getRowValue(row, ['message_id', 'messageId', 'id']),
    client_id: getRowValue(row, ['client_id', 'clientId', 'cliente_id', 'cliente', 'client']),
    client_name: getRowValue(row, ['client_name', 'clientName', 'cliente', 'clienta']),
    sender: getRowValue(row, ['sender', 'remetente', 'author'], 'support'),
    sender_name: getRowValue(row, ['sender_name', 'senderName', 'nome_remetente'], 'Support Team'),
    message: getRowValue(row, ['message', 'mensagem', 'text']),
    timestamp: getRowValue(row, ['timestamp', 'data_hora', 'created_at']),
    created_at: getRowValue(row, ['created_at', 'sent_at', 'createdAt']),
    type: getRowValue(row, ['type', 'tipo'], 'message'),
    status: getRowValue(row, ['status', 'estado'], 'sent'),
    source: getRowValue(row, ['source', 'origem']),
    metadata:
      typeof row.metadata === 'object' && row.metadata !== null
        ? (row.metadata as Record<string, unknown>)
        : {},
  };
}

export async function addConversationMessage(input: ConversationMessageInput) {
  const supabase = getSupabaseServerClient();

  console.log('[CHAT-STORAGE] Adding message:', {
    clientId: input.clientId,
    sender: input.sender,
    messageLength: input.message?.length,
    table: MESSAGES_TABLE,
  });

  const row = {
    created_at: new Date().toISOString(),
    client_id: input.clientId,
    client_name: input.clientName,
    sender: input.sender,
    sender_name: input.senderName,
    message: input.message,
    timestamp: input.timestamp || new Date().toLocaleString('pt-BR'),
    type: input.type || 'message',
    status: input.status || 'sent',
    source: input.source || null,
    metadata: input.metadata || {},
  };

  console.log('[CHAT-STORAGE] Row to insert:', row);

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .insert(row)
    .select()
    .single();

  if (!error) {
    console.log('[CHAT-STORAGE] Message inserted successfully:', data);
    return data;
  }

  console.error('[CHAT-STORAGE] Insert error:', {
    code: (error as any)?.code,
    message: (error as any)?.message,
    status: (error as any)?.status,
    details: (error as any)?.details,
  });

  if (!isMissingColumnError(error)) {
    console.error('[CHAT-STORAGE] Non-recoverable error, throwing:', error);
    throw error;
  }

  console.log('[CHAT-STORAGE] Column mismatch detected, trying fallback rows...');

  const fallbackRows = [
    {
      created_at: new Date().toISOString(),
      clientId: input.clientId,
      clientName: input.clientName,
      sender: input.sender,
      senderName: input.senderName,
      message: input.message,
      timestamp: input.timestamp || new Date().toLocaleString('pt-BR'),
      type: input.type || 'message',
      status: input.status || 'sent',
      source: input.source || null,
      metadata: input.metadata || {},
    },
    {
      created_at: new Date().toISOString(),
      clientId: input.clientId,
      sender: input.sender,
      message: input.message,
      status: input.status || 'sent',
    },
    {
      id: Date.now(),
      created_at: new Date().toISOString(),
      clientId: input.clientId,
      sender: input.sender,
      message: input.message,
      status: input.status || 'sent',
    },
  ];

  for (let i = 0; i < fallbackRows.length; i++) {
    const fallbackRow = fallbackRows[i];
    console.log(`[CHAT-STORAGE] Trying fallback row ${i + 1}:`, fallbackRow);

    const fallbackResult = await supabase
      .from(MESSAGES_TABLE)
      .insert(fallbackRow)
      .select()
      .single();

    if (!fallbackResult.error) {
      console.log(`[CHAT-STORAGE] Fallback ${i + 1} succeeded:`, fallbackResult.data);
      return fallbackResult.data;
    }

    console.warn(`[CHAT-STORAGE] Fallback ${i + 1} failed:`, {
      code: (fallbackResult.error as any)?.code,
      message: (fallbackResult.error as any)?.message,
    });

    if (!isMissingColumnError(fallbackResult.error)) {
      console.error('[CHAT-STORAGE] Non-recoverable error in fallback:', fallbackResult.error);
      throw fallbackResult.error;
    }
  }

  console.error('[CHAT-STORAGE] All attempts failed, throwing original error:', error);
  throw error;
}

export async function updateConversationMessage(
  id: string,
  updates: {
    status?: MessageStatus;
    metadata?: Record<string, unknown>;
  }
) {
  const supabase = getSupabaseServerClient();

  const payload: Record<string, unknown> = {};
  if (updates.status) payload.status = updates.status;
  if (updates.metadata) payload.metadata = updates.metadata;

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (!error) return data;
  if (isMissingColumnError(error)) {
    return {
      id,
      status: updates.status,
      metadata: updates.metadata || {},
    };
  }

  throw error;
}

export async function getConversationMessages(clientId: string, limit: number, offset: number) {
  const supabase = getSupabaseServerClient();

  const rangeFrom = Math.max(offset, 0);
  const rangeTo = Math.max(rangeFrom + limit - 1, rangeFrom);

  const primaryQuery = await supabase
    .from(MESSAGES_TABLE)
    .select('*', { count: 'exact' })
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
    .range(rangeFrom, rangeTo);

  if (!primaryQuery.error) {
    return {
      rows: (primaryQuery.data || []).map((row) => normalizeMessageRow(row as Record<string, unknown>)),
      total: primaryQuery.count || 0,
    };
  }

  if (!isMissingColumnError(primaryQuery.error)) throw primaryQuery.error;

  const fallbackQuery = await supabase
    .from(MESSAGES_TABLE)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: true });

  if (fallbackQuery.error) throw fallbackQuery.error;

  const normalized = (fallbackQuery.data || []).map((row) => normalizeMessageRow(row as Record<string, unknown>));
  const filtered = normalized.filter((row) => row.client_id === clientId);
  const paged = filtered.slice(rangeFrom, rangeTo + 1);

  return {
    rows: paged,
    total: filtered.length,
  };
}

export async function deleteConversationMessages(clientId: string) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .delete()
    .eq('client_id', clientId)
    .select('id');

  if (!error) return data?.length || 0;
  if (!isMissingColumnError(error)) throw error;

  const existing = await getConversationMessages(clientId, 10000, 0);
  const ids = existing.rows.map((row) => row.id).filter(Boolean);

  if (ids.length === 0) return 0;

  const fallbackDelete = await supabase.from(MESSAGES_TABLE).delete().in('id', ids).select('id');
  if (fallbackDelete.error) throw fallbackDelete.error;

  return fallbackDelete.data?.length || 0;
}

export async function getClientsFromChurnDashboard() {
  const supabase = getSupabaseServerClient();

  console.log('[CHAT-STORAGE] Starting client search across candidates:', CLIENTS_TABLE_CANDIDATES);

  let clientsRows: Record<string, unknown>[] = [];
  let clientsTableName = '';

  for (const tableName of CLIENTS_TABLE_CANDIDATES) {
    try {
      console.log(`[CHAT-STORAGE] Attempting to load clients from table: "${tableName}"`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (!error) {
        clientsRows = (data || []) as Record<string, unknown>[];
        clientsTableName = tableName;
        console.log(`[CHAT-STORAGE] ✅ SUCCESS! Clients loaded from table: "${tableName}" (${clientsRows.length} records)`);
        break;
      }

      if (!isMissingRelationError(error)) {
        console.error(`[CHAT-STORAGE] Non-recoverable error for clients table "${tableName}":`, error);
        throw error;
      }
    } catch (err) {
      console.error(`[CHAT-STORAGE] Exception trying clients table "${tableName}":`, err);
      throw err;
    }
  }

  if (!clientsTableName) {
    throw {
      code: '42P01',
      message: `relation not found for any candidate table: ${CLIENTS_TABLE_CANDIDATES.join(', ')}`,
    };
  }

  console.log('[CHAT-STORAGE] Starting churn table search across candidates:', CHURN_DASHBOARD_TABLE_CANDIDATES);

  let churnRows: Record<string, unknown>[] = [];
  let churnTableName = '';

  for (const tableName of CHURN_DASHBOARD_TABLE_CANDIDATES) {
    try {
      console.log(`[CHAT-STORAGE] Attempting to load churn data from table: "${tableName}"`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (!error) {
        churnRows = (data || []) as Record<string, unknown>[];
        churnTableName = tableName;
        console.log(`[CHAT-STORAGE] ✅ SUCCESS! Churn rows loaded from table: "${tableName}" (${churnRows.length} records)`);
        break;
      }

      if (!isMissingRelationError(error)) {
        console.error(`[CHAT-STORAGE] Non-recoverable error for churn table "${tableName}":`, error);
        throw error;
      }
    } catch (err) {
      console.error(`[CHAT-STORAGE] Exception trying churn table "${tableName}":`, err);
      throw err;
    }
  }

  if (!churnTableName) {
    console.warn('[CHAT-STORAGE] ChurnDashboard table not found. Returning base clients from Clientes_Database.');
    return mapClientsBaseRows(clientsRows);
  }

  if (churnRows.length === 0) {
    console.warn('[CHAT-STORAGE] ChurnDashboard table is empty. Returning base clients from Clientes_Database.');
    return mapClientsBaseRows(clientsRows);
  }

  const churnByChatId = getLatestChurnRowsByChatId(churnRows);

  console.log(`[CHAT-STORAGE] Clientes: ${clientsRows.length} | Relatórios Churn: ${churnByChatId.size}`);

  return clientsRows.map((clientRow) => {
    const dashboardKey = getClientDashboardValue(clientRow);
    const normalizedDashboardKey = dashboardKey ? extractChatIdentifier(dashboardKey) : null;
    const churnRow = normalizedDashboardKey ? churnByChatId.get(normalizedDashboardKey) : undefined;

    const fallbackClientName = getRowValue(clientRow, ['cliente', 'Cliente', 'name', 'client_name'], 'Sem nome');
    const clientNameFromChurn = getRowValue(churnRow || {}, ['cliente', 'client_name', 'clientName', 'name']);

    return {
      ...clientRow,
      id: getRowValue(clientRow, ['id', 'Id', 'ID'], dashboardKey || createInternalId('client')),
      cliente: fallbackClientName,
      cliente_churn: clientNameFromChurn || fallbackClientName,
      chat_id: getRowChatId(churnRow || {}) || dashboardKey,
      status: getRowValue(churnRow || {}, ['status'], getRowValue(clientRow, ['status'], '')),
      score: getRowNumberValue(churnRow || {}, ['score', 'riskLevel', 'risco'], getRowNumberValue(clientRow, ['score', 'riskLevel'], 0)),
      tendencia: getRowValue(churnRow || {}, ['tendencia', 'trend'], getRowValue(clientRow, ['tendencia', 'trend'], '')),
      squad: getRowValue(churnRow || {}, ['squad'], getRowValue(clientRow, ['squad'], 'Não atribuído')),
      responsavel: getRowValue(churnRow || {}, ['responsavel', 'actionOwner'], getRowValue(clientRow, ['responsavel', 'actionOwner'], 'Não atribuído')),
      detrator: getRowValue(churnRow || {}, ['detrator', 'detractor'], getRowValue(clientRow, ['detrator', 'detractor'], 'Não identificado')),
      evidencia: getRowValue(churnRow || {}, ['evidencia', 'evidence'], getRowValue(clientRow, ['evidencia', 'evidence'], 'Análise pendente')),
      acaoRecomendada: getRowValue(
        churnRow || {},
        ['acaoRecomendada', 'acao_recomendada', 'actionDescription'],
        getRowValue(clientRow, ['acaoRecomendada', 'actionDescription'], 'Aguardando análise inicial')
      ),
      data_evidencia: getRowValue(churnRow || {}, ['data_evidencia', 'evidenceTimestamp'], getRowValue(clientRow, ['data_evidencia'], '')),
      ultima_Mensagem: getRowValue(churnRow || {}, ['ultima_Mensagem', 'lastMessage'], getRowValue(clientRow, ['ultima_Mensagem'], '')),
      created_at: getRowCreatedAt(churnRow || {}) || getRowCreatedAt(clientRow),
      email: getRowValue(clientRow, ['email', 'Email']),
      phone: getRowValue(clientRow, ['phone', 'telefone', 'Phone']),
      Dashboard: dashboardKey,
    };
  });
}

export async function getClientFromChurnDashboard(clientId: string) {
  const clients = await getClientsFromChurnDashboard();
  const match = clients.find((row) => {
    const rowId = getRowValue(row as Record<string, unknown>, ['id', 'Id', 'ID']);
    return rowId === clientId;
  });

  return match || null;
}

export async function addWebhookEvent(input: WebhookEventInput) {
  const supabase = getSupabaseServerClient();

  console.log('[CHAT-STORAGE] Adding webhook event:', {
    type: input.type,
    clientId: input.clientId,
    endpoint: input.endpoint,
    table: WEBHOOK_EVENTS_TABLE,
  });

  const row = {
    timestamp: new Date().toISOString(),
    type: input.type,
    status: input.status,
    client_id: input.clientId,
    client_name: input.clientName,
    endpoint: input.endpoint,
    source: input.source || null,
    message_id: input.messageId || null,
    payload: input.payload || {},
    response: input.response || {},
    error: input.error || null,
  };

  const { data, error } = await supabase
    .from(WEBHOOK_EVENTS_TABLE)
    .insert(row)
    .select()
    .single();

  if (!error) {
    console.log('[CHAT-STORAGE] Webhook event inserted:', data);
    return data;
  }

  const errorCode = (error as any)?.code;
  const errorMessage = (error as any)?.message;
  
  console.warn('[CHAT-STORAGE] Webhook event insert error:', {
    code: errorCode,
    message: errorMessage,
  });

  if (isMissingRelationError(error) || isMissingColumnError(error)) {
    console.log('[CHAT-STORAGE] Webhook table missing, returning fallback');
    return {
      id: createInternalId('log'),
      timestamp: row.timestamp,
      type: input.type,
      status: input.status,
      client_id: input.clientId,
      client_name: input.clientName,
    };
  }

  // For unknown errors, also return fallback (webhook events are non-critical)
  console.warn('[CHAT-STORAGE] Webhook event error (but continuing):', errorMessage || error);
  return {
    id: createInternalId('log'),
    timestamp: row.timestamp,
    type: input.type,
    status: input.status || 'error',
    client_id: input.clientId,
    client_name: input.clientName,
  };
}

export async function updateWebhookEvent(
  id: string,
  updates: {
    status?: number | string;
    response?: Record<string, unknown>;
    error?: string | null;
  }
) {
  const supabase = getSupabaseServerClient();

  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.response) payload.response = updates.response;
  if (updates.error !== undefined) payload.error = updates.error;

  const { data, error } = await supabase
    .from(WEBHOOK_EVENTS_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (!error) return data;

  if (isMissingRelationError(error) || isMissingColumnError(error)) {
    return {
      id,
      ...payload,
    };
  }

  throw error;
}

export async function getWebhookEvents(params: {
  type?: 'sent' | 'received' | 'error';
  clientId?: string;
  source?: string;
  limit: number;
}) {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from(WEBHOOK_EVENTS_TABLE)
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .limit(params.limit);

  if (params.type) query = query.eq('type', params.type);
  if (params.clientId) query = query.eq('client_id', params.clientId);
  if (params.source) query = query.eq('source', params.source);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    rows: data || [],
    total: count || 0,
  };
}
