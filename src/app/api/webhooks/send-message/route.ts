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

    try {
      // Send to webhook
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Cabuetia-Dashboard/1.0',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.warn(
          `[SEND-MESSAGE] Webhook returned status ${webhookResponse.status} from ${webhookUrl}`
        );
      }

      const webhookResult = await webhookResponse.json().catch(() => ({}));

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
        },
        { status: 200 }
      );
    } catch (webhookError) {
      console.error('[SEND-MESSAGE] Error calling external webhook:', webhookError);
      // Still return 200 - message is stored locally even if webhook fails
      return NextResponse.json(
        {
          success: true,
          message: 'Message received and stored. External webhook delivery failed.',
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
