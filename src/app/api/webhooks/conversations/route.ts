import { NextRequest, NextResponse } from 'next/server';
import {
  addConversationMessage,
  deleteConversationMessages,
  getConversationMessages,
} from '@/lib/chat-storage';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Internal server error';
  }
}

function isMissingConversationTableError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  const message = getErrorMessage(error);

  return (
    code === '42P01' ||
    message.includes('42P01') ||
    (message.includes('conversation_messages') && message.includes('does not exist'))
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientId, clientName, clientEmail, clientPhone } = body;

    if (!action || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, clientId' },
        { status: 400 }
      );
    }

    if (action === 'add_message') {
      const { messageId, sender, senderName, message, timestamp, type, status, error, source, direction, webhookStatus, metadata } = body;

      if (!sender || !senderName || !message) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: sender, senderName, message',
          },
          { status: 400 }
        );
      }

      const conversationMessage = await addConversationMessage({
        messageId,
        clientId,
        clientName: clientName || 'Unknown Client',
        clientEmail,
        clientPhone,
        sender,
        senderName,
        message,
        timestamp,
        type,
        status,
        error,
        source,
        direction,
        webhookStatus,
        metadata,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Message added to conversation',
          data: {
            conversationId: `thread_${clientId}`,
            messageId: conversationMessage.id,
            clientId,
          },
        },
        { status: 201 }
      );
    }

    if (action === 'link_response') {
      const { originalMessageId, response, responseSource, status } = body;

      if (!originalMessageId || !response) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: originalMessageId, response',
          },
          { status: 400 }
        );
      }

      const responseMessage = await addConversationMessage({
        messageId: originalMessageId,
        clientId,
        clientName: clientName || 'Unknown Client',
        clientEmail,
        clientPhone,
        sender: 'system',
        senderName: `Sistema - ${responseSource || 'Resposta Automática'}`,
        message: typeof response === 'string' ? response : JSON.stringify(response),
        timestamp: new Date().toLocaleString('pt-BR'),
        type: 'message',
        status: status || 'received',
        source: responseSource || 'external_service',
        direction: 'inbound',
        metadata: {
          linkedOriginalMessageId: originalMessageId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Response linked to conversation',
          data: {
            conversationId: `thread_${clientId}`,
            responseMessageId: responseMessage.id,
            originalMessageId,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Valid actions: add_message, link_response' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[CONVERSATION] Error processing request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: clientId' },
        { status: 400 }
      );
    }

    const { rows, total } = await getConversationMessages(clientId, limit, offset);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No conversation history found',
          data: {
            clientId,
            threadId: null,
            messages: [],
            stats: {
              totalMessages: 0,
              sentMessages: 0,
              receivedMessages: 0,
              failedMessages: 0,
            },
          },
        },
        { status: 200 }
      );
    }

    const first = rows[0];

    const stats = {
      totalMessages: total,
      sentMessages: rows.filter((m) => m.status === 'sent').length,
      receivedMessages: rows.filter((m) => m.status === 'received').length,
      failedMessages: rows.filter((m) => m.status === 'failed').length,
      messagesByType: {
        message: rows.filter((m) => m.type === 'message').length,
        note: rows.filter((m) => m.type === 'note').length,
        alert: rows.filter((m) => m.type === 'alert').length,
      },
      messagesByAuthor: {
        support: rows.filter((m) => m.sender === 'support').length,
        client: rows.filter((m) => m.sender === 'client').length,
        system: rows.filter((m) => m.sender === 'system').length,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          clientId,
          clientName: first.client_name,
          threadId: `thread_${clientId}`,
          createdAt: first.created_at,
          updatedAt: rows[rows.length - 1].created_at,
          pagination: {
            limit,
            offset,
            total,
            count: rows.length,
          },
          stats,
          messages: rows.map((row) => ({
            id: row.id,
            sender: row.sender,
            senderName: row.sender_name,
            message: row.message,
            timestamp: row.timestamp,
            sentAt: row.created_at,
            type: row.type || 'message',
            status: row.status,
            source: row.source,
            metadata: row.metadata,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    if (errorMessage.includes('Supabase not configured')) {
      const { searchParams } = new URL(request.url);
      const clientId = searchParams.get('clientId');

      return NextResponse.json(
        {
          success: true,
          message: 'Supabase ainda não configurado. Retornando histórico vazio temporariamente.',
          data: {
            clientId,
            threadId: null,
            messages: [],
            stats: {
              totalMessages: 0,
              sentMessages: 0,
              receivedMessages: 0,
              failedMessages: 0,
            },
          },
          warning: 'supabase_not_configured',
        },
        { status: 200 }
      );
    }

    if (isMissingConversationTableError(error)) {
      const { searchParams } = new URL(request.url);
      const clientId = searchParams.get('clientId');

      return NextResponse.json(
        {
          success: true,
          message: 'Tabela de conversas ainda não criada no Supabase. Retornando histórico vazio temporariamente.',
          data: {
            clientId,
            threadId: null,
            messages: [],
            stats: {
              totalMessages: 0,
              sentMessages: 0,
              receivedMessages: 0,
              failedMessages: 0,
            },
          },
          warning: 'conversation_table_missing',
        },
        { status: 200 }
      );
    }

    console.error('[CONVERSATION] Error retrieving conversation:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: clientId' },
        { status: 400 }
      );
    }

    const deletedCount = await deleteConversationMessages(clientId);

    if (deletedCount > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Conversation deleted successfully',
          deletedMessageCount: deletedCount,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Conversation thread not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[CONVERSATION] Error deleting conversation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
