import { NextRequest, NextResponse } from 'next/server';
import {
  addConversationMessage,
  addWebhookEvent,
  updateConversationMessage,
  updateWebhookEvent,
} from '@/lib/chat-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      message,
      senderName,
      sender,
      timestamp,
    } = body;

    if (!clientId || !message || !senderName || !sender) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: clientId, message, senderName, sender',
        },
        { status: 400 }
      );
    }

    const conversationRecord = await addConversationMessage({
      clientId,
      clientName: clientName || 'Unknown Client',
      clientEmail,
      clientPhone,
      sender,
      senderName,
      message,
      timestamp,
      type: 'message',
      status: 'sent',
      source: 'dashboard',
      direction: 'outbound',
      metadata: {
        flow: 'send-message',
      },
    });

    const webhookUrl = process.env.CHAT_WEBHOOK_URL || process.env.WEBHOOK_URL;

    const webhookEvent = await addWebhookEvent({
      type: 'sent',
      clientId,
      clientName: clientName || 'Unknown Client',
      endpoint: webhookUrl || 'local_only',
      status: 'pending',
      source: 'dashboard',
      messageId: conversationRecord.id,
      payload: {
        clientId,
        clientName,
        clientEmail,
        clientPhone,
        message,
        senderName,
        sender,
        timestamp,
      },
    });

    console.log('[SEND-MESSAGE] Webhook URL configured:', webhookUrl ? 'Yes' : 'No');
    console.log('[SEND-MESSAGE] Processing message from:', clientName, '(', clientId, ')');

    if (!webhookUrl) {
      await updateWebhookEvent(webhookEvent.id, {
        status: 'stored_local_only',
        response: {
          message: 'No webhook URL configured',
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Message received and stored. No external webhook configured.',
          data: {
            clientId,
            clientName,
            senderName,
            sender,
            timestamp,
            messageId: conversationRecord.id,
            status: conversationRecord.status,
            source: conversationRecord.source,
          },
        },
        { status: 200 }
      );
    }

    const webhookPayload = {
      event: 'chat.message_sent',
      timestamp: new Date().toISOString(),
      data: {
        clientId,
        clientName,
        clientEmail,
        clientPhone,
        message,
        senderName,
        sender,
        messageTimestamp: timestamp,
      },
    };

    console.log('[SEND-MESSAGE] Sending to webhook:', webhookUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Cabuetia-Dashboard/1.0',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const webhookResult = await webhookResponse.json().catch(() => ({}));

      await updateWebhookEvent(webhookEvent.id, {
        status: webhookResponse.status,
        response: webhookResult,
        error: webhookResponse.ok ? null : `Webhook returned status ${webhookResponse.status}`,
      });

      if (!webhookResponse.ok) {
        await updateConversationMessage(conversationRecord.id, {
          status: 'failed',
          metadata: {
            flow: 'send-message',
            webhookResult,
            webhookStatus: webhookResponse.status,
            error: `Webhook returned status ${webhookResponse.status}`,
          },
        });
      } else {
        await updateConversationMessage(conversationRecord.id, {
          status: 'sent',
          metadata: {
            flow: 'send-message',
            webhookResult,
            webhookStatus: webhookResponse.status,
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Message processed successfully',
          data: {
            clientId,
            clientName,
            senderName,
            sender,
            timestamp,
            messageId: conversationRecord.id,
          },
          webhookStatus: webhookResponse.status,
          webhookResult,
        },
        { status: 200 }
      );
    } catch (webhookError) {
      console.error('[SEND-MESSAGE] Error calling external webhook:', webhookError);

      const isTimeout = webhookError instanceof Error && webhookError.name === 'AbortError';
      const errorMessage = webhookError instanceof Error ? webhookError.message : String(webhookError);

      await updateWebhookEvent(webhookEvent.id, {
        status: isTimeout ? 'timeout' : 'error',
        error: errorMessage,
      });

      await updateConversationMessage(conversationRecord.id, {
        status: 'failed',
        metadata: {
          flow: 'send-message',
          warning: isTimeout ? 'timeout' : 'error',
          error: errorMessage,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: isTimeout
            ? 'Message received. Webhook timeout (>10s). Check n8n connection.'
            : 'Message received and stored. External webhook delivery failed.',
          warning: isTimeout ? 'timeout' : 'error',
          error: errorMessage,
          data: {
            clientId,
            clientName,
            senderName,
            sender,
            timestamp,
            messageId: conversationRecord.id,
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      type: error?.constructor?.name || typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      raw: typeof error === 'object' && error !== null ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : error,
    };

    console.error('[SEND-MESSAGE] Error processing request:', JSON.stringify(errorDetails, null, 2));

    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error !== null && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = `Unknown error (${typeof error})`;
      }
    } else {
      errorMessage = `Unknown error (${typeof error})`;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
