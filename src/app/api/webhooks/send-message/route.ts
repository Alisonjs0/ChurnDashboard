import { NextRequest, NextResponse } from 'next/server';

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

    // Validate required fields
    if (!clientId || !message || !senderName || !sender) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: clientId, message, senderName, sender',
        },
        { status: 400 }
      );
    }

    // Get webhook URL from environment variable
    const webhookUrl = process.env.CHAT_WEBHOOK_URL || process.env.WEBHOOK_URL;

    console.log('[SEND-MESSAGE] Webhook URL configured:', webhookUrl ? 'Yes' : 'No');
    console.log('[SEND-MESSAGE] Processing message from:', clientName, '(', clientId, ')');

    if (!webhookUrl) {
      console.log('[SEND-MESSAGE] No webhook URL configured. Message accepted locally.');
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
          },
        },
        { status: 200 }
      );
    }

    // Prepare the webhook payload
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
    console.log('[SEND-MESSAGE] Payload:', JSON.stringify(webhookPayload, null, 2));

    try {
      // Send to webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

      console.log('[SEND-MESSAGE] Webhook response status:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text().catch(() => 'No error details');
        console.warn(
          `[SEND-MESSAGE] Webhook returned status ${webhookResponse.status} from ${webhookUrl}`
        );
        console.warn('[SEND-MESSAGE] Error details:', errorText);
      }

      const webhookResult = await webhookResponse.json().catch(() => ({}));
      console.log('[SEND-MESSAGE] Webhook result:', webhookResult);

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
          },
          webhookStatus: webhookResponse.status,
          webhookResult,
        },
        { status: 200 }
      );
    } catch (webhookError) {
      console.error('[SEND-MESSAGE] Error calling external webhook:', webhookError);
      console.error('[SEND-MESSAGE] Error name:', webhookError instanceof Error ? webhookError.name : 'Unknown');
      console.error('[SEND-MESSAGE] Error message:', webhookError instanceof Error ? webhookError.message : String(webhookError));
      
      // Check if it was a timeout
      const isTimeout = webhookError instanceof Error && webhookError.name === 'AbortError';
      
      // Still return 200 - message is stored locally even if webhook fails
      return NextResponse.json(
        {
          success: true,
          message: isTimeout 
            ? 'Message received. Webhook timeout (>10s). Check n8n connection.'
            : 'Message received and stored. External webhook delivery failed.',
          warning: isTimeout ? 'timeout' : 'error',
          error: webhookError instanceof Error ? webhookError.message : String(webhookError),
          data: {
            clientId,
            clientName,
            senderName,
            sender,
            timestamp,
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('[SEND-MESSAGE] Error processing request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
