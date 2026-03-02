import { NextRequest, NextResponse } from 'next/server';
import { addConversationMessage, addWebhookEvent, getWebhookEvents } from '@/lib/chat-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      messageId,
      clientId,
      clientName,
      status,
      response,
      timestamp,
      source,
    } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    const eventRecord = await addWebhookEvent({
      type: 'received',
      clientId,
      clientName: clientName || 'Cliente',
      endpoint: '/api/webhooks/receive-response',
      status: status || 'received',
      source: source || 'external_service',
      messageId,
      payload: {
        messageId,
        clientId,
        clientName,
        response,
        timestamp,
        source,
      },
    });

    const responseText = typeof response === 'string' ? response : JSON.stringify(response);

    await addConversationMessage({
      messageId,
      clientId,
      clientName: clientName || 'Cliente',
      sender: 'client',
      senderName: clientName || 'Cliente',
      message: responseText,
      timestamp: timestamp || new Date().toLocaleString('pt-BR'),
      type: 'message',
      status: 'received',
      source: source || 'external_service',
      direction: 'inbound',
      metadata: {
        webhookEventId: eventRecord.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook response received successfully',
        responseId: eventRecord.id,
        data: {
          clientId,
          clientName,
          status,
          receivedAt: eventRecord.timestamp,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[RECEIVE-RESPONSE] Error processing webhook response:', error);
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
    const clientId = searchParams.get('clientId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const source = searchParams.get('source') || undefined;

    const { rows, total } = await getWebhookEvents({
      type: 'received',
      clientId,
      source,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        count: rows.length,
        total,
        data: rows.map((row) => ({
          id: row.id,
          receivedAt: row.timestamp,
          source: row.source,
          status: row.status,
          payload: row.payload,
          response: row.response,
          error: row.error,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[RECEIVE-RESPONSE] Error retrieving responses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
