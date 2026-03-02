import { getSupabaseServerClient } from '@/lib/supabase-server';

const MESSAGES_TABLE = 'Churn Dashboard | Messages';
const CLIENTS_TABLE = 'Churn Dashboard';
const WEBHOOK_EVENTS_TABLE = 'webhook_events';
const CLIENTS_TABLE_CANDIDATES = [
  CLIENTS_TABLE,
  'Churn Dashboarde',
  'churn_dashboard',
  'churn_dashboarde',
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

  for (const tableName of CLIENTS_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) return data || [];
    if (!isMissingRelationError(error)) throw error;
  }

  throw {
    code: '42P01',
    message: `relation not found for any candidate table: ${CLIENTS_TABLE_CANDIDATES.join(', ')}`,
  };
}

export async function getClientFromChurnDashboard(clientId: string) {
  const supabase = getSupabaseServerClient();

  for (const tableName of CLIENTS_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', clientId)
      .single();

    if (!error) return data || null;
    if (error.code === 'PGRST116') return null;
    if (!isMissingRelationError(error)) throw error;
  }

  throw {
    code: '42P01',
    message: `relation not found for any candidate table: ${CLIENTS_TABLE_CANDIDATES.join(', ')}`,
  };
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
