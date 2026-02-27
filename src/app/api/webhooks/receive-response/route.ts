import { NextRequest, NextResponse } from 'next/server';

/**
 * ATENÇÃO VERCEL: Este armazenamento em memória NÃO persiste entre requisições no Vercel!
 * No Vercel, cada função serverless é stateless e os dados são perdidos.
 * Para produção, considere usar:
 * - Vercel KV (Redis)
 * - MongoDB Atlas
 * - Supabase
 * - Firebase Firestore
 * 
 * Este endpoint funciona perfeitamente para receber webhooks, mas os dados
 * não serão persistidos entre deploys ou múltiplas instâncias.
 */

// In-memory storage for webhook responses (in production, use a database)
let webhookResponses: Array<{
  id: string;
  receivedAt: string;
  source: string;
  status: string;
  payload: unknown;
}> = [];

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

    // Validate required fields
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    // Create response record
    const responseRecord = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: new Date().toISOString(),
      source: source || 'external_service',
      status: status || 'received',
      payload: {
        messageId,
        clientId,
        clientName,
        response,
        timestamp,
        source,
      },
    };

    // Store in memory
    webhookResponses.push(responseRecord);

    // Keep only last 100 responses to prevent memory issues
    if (webhookResponses.length > 100) {
      webhookResponses = webhookResponses.slice(-100);
    }

    console.log(
      `[RECEIVE-RESPONSE] Response received from ${source || 'unknown'}:`,
      responseRecord.id
    );

    // Add response to conversation history automatically
    try {
      const conversationPayload = {
        action: 'add_message',
        clientId,
        clientName: clientName || 'Cliente',
        sender: 'client',
        senderName: `${clientName || 'Cliente'} (via ${source || 'n8n'})`,
        message: typeof response === 'string' ? response : JSON.stringify(response),
        timestamp: new Date().toLocaleString('pt-BR'),
        type: 'message',
        status: status || 'received',
      };

      // Call internal conversation API
      const conversationRes = await fetch(
        `${request.nextUrl.origin}/api/webhooks/conversations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationPayload),
        }
      );

      if (conversationRes.ok) {
        console.log('[RECEIVE-RESPONSE] Message added to conversation history');
      } else {
        console.warn('[RECEIVE-RESPONSE] Failed to add to conversation:', await conversationRes.text());
      }
    } catch (convError) {
      console.error('[RECEIVE-RESPONSE] Error adding to conversation:', convError);
      // Don't fail the webhook response if conversation storage fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook response received successfully',
        responseId: responseRecord.id,
        data: {
          clientId,
          clientName,
          status,
          receivedAt: responseRecord.receivedAt,
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
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const source = searchParams.get('source');

    let filtered = [...webhookResponses];

    // Filter by clientId if provided
    if (clientId) {
      filtered = filtered.filter((r) => {
        const payload = r.payload as any;
        return payload?.clientId === clientId;
      });
    }

    // Filter by source if provided
    if (source) {
      filtered = filtered.filter((r) => r.source === source);
    }

    // Sort by most recent first
    filtered.sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    // Apply limit
    const responses = filtered.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        count: responses.length,
        total: filtered.length,
        data: responses,
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
