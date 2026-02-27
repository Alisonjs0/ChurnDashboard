import { NextRequest, NextResponse } from 'next/server';

// In-memory conversation storage
interface ConversationMessage {
  id: string;
  messageId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  sender: 'support' | 'client' | 'system';
  senderName: string;
  message: string;
  timestamp: string;
  sentAt: string;
  type?: 'message' | 'note' | 'alert';
  status: 'sent' | 'received' | 'failed';
  error?: string;
}

interface ConversationThread {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  latestMessage: string;
  messages: ConversationMessage[];
}

// Store: clientId -> ConversationThread
let conversationThreads: Record<string, ConversationThread> = {};

function getOrCreateThread(
  clientId: string,
  clientName: string,
  clientEmail?: string,
  clientPhone?: string
): ConversationThread {
  if (!conversationThreads[clientId]) {
    conversationThreads[clientId] = {
      id: `thread_${clientId}_${Date.now()}`,
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      latestMessage: '',
      messages: [],
    };
  }
  return conversationThreads[clientId];
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

    // Action: add_message - Adiciona uma mensagem ao histórico
    if (action === 'add_message') {
      const {
        messageId,
        sender,
        senderName,
        message,
        timestamp,
        type,
        status,
        error,
      } = body;

      if (!sender || !senderName || !message) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Missing required fields: sender, senderName, message',
          },
          { status: 400 }
        );
      }

      const thread = getOrCreateThread(
        clientId,
        clientName || 'Unknown Client',
        clientEmail,
        clientPhone
      );

      const conversationMessage: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientId,
        clientName: clientName || 'Unknown Client',
        clientEmail,
        clientPhone,
        sender,
        senderName,
        message,
        timestamp: timestamp || new Date().toLocaleString('pt-BR'),
        sentAt: new Date().toISOString(),
        type: type || 'message',
        status: status || 'sent',
        error,
      };

      thread.messages.push(conversationMessage);
      thread.messageCount = thread.messages.length;
      thread.latestMessage = message;
      thread.updatedAt = new Date().toISOString();

      // Keep only last 1000 messages per thread to manage memory
      if (thread.messages.length > 1000) {
        thread.messages = thread.messages.slice(-1000);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Message added to conversation',
          data: {
            conversationId: thread.id,
            messageId: conversationMessage.id,
            clientId,
            messageCount: thread.messageCount,
          },
        },
        { status: 201 }
      );
    }

    // Action: link_response - Vincula uma resposta a uma mensagem original
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

      const thread = conversationThreads[clientId];
      if (!thread) {
        return NextResponse.json(
          { success: false, error: 'Conversation thread not found' },
          { status: 404 }
        );
      }

      // Add response as a system/service message
      const responseMessage: ConversationMessage = {
        id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messageId: originalMessageId,
        clientId,
        clientName: clientName || thread.clientName,
        clientEmail: clientEmail || thread.clientEmail,
        clientPhone: clientPhone || thread.clientPhone,
        sender: 'system',
        senderName: `Sistema - ${responseSource || 'Resposta Automática'}`,
        message: typeof response === 'string' ? response : JSON.stringify(response),
        timestamp: new Date().toLocaleString('pt-BR'),
        sentAt: new Date().toISOString(),
        type: 'message',
        status: status || 'received',
      };

      thread.messages.push(responseMessage);
      thread.messageCount = thread.messages.length;
      thread.latestMessage = responseMessage.message;
      thread.updatedAt = new Date().toISOString();

      return NextResponse.json(
        {
          success: true,
          message: 'Response linked to conversation',
          data: {
            conversationId: thread.id,
            responseMessageId: responseMessage.id,
            originalMessageId,
            messageCount: thread.messageCount,
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

    const thread = conversationThreads[clientId];
    if (!thread) {
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

    // Calculate statistics
    const stats = {
      totalMessages: thread.messages.length,
      sentMessages: thread.messages.filter((m) => m.status === 'sent').length,
      receivedMessages: thread.messages.filter((m) => m.status === 'received').length,
      failedMessages: thread.messages.filter((m) => m.status === 'failed').length,
      messagesByType: {
        message: thread.messages.filter((m) => m.type === 'message').length,
        note: thread.messages.filter((m) => m.type === 'note').length,
        alert: thread.messages.filter((m) => m.type === 'alert').length,
      },
      messagesByAuthor: {
        support: thread.messages.filter((m) => m.sender === 'support').length,
        client: thread.messages.filter((m) => m.sender === 'client').length,
        system: thread.messages.filter((m) => m.sender === 'system').length,
      },
    };

    // Apply pagination
    const messages = thread.messages.slice(offset, offset + limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          clientId,
          clientName: thread.clientName,
          clientEmail: thread.clientEmail,
          clientPhone: thread.clientPhone,
          threadId: thread.id,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          pagination: {
            limit,
            offset,
            total: thread.messages.length,
            count: messages.length,
          },
          stats,
          messages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CONVERSATION] Error retrieving conversation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
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

    if (conversationThreads[clientId]) {
      const messageCount = conversationThreads[clientId].messages.length;
      delete conversationThreads[clientId];
      return NextResponse.json(
        {
          success: true,
          message: 'Conversation deleted successfully',
          deletedMessageCount: messageCount,
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
