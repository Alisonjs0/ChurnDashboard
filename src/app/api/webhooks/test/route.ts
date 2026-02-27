import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const webhookUrl = process.env.CHAT_WEBHOOK_URL || process.env.WEBHOOK_URL;

  console.log('=== WEBHOOK TEST ===');
  console.log('Webhook URL:', webhookUrl);
  console.log('Environment:', process.env.NODE_ENV);

  if (!webhookUrl) {
    return NextResponse.json({
      success: false,
      error: 'WEBHOOK_URL not configured',
      env: {
        NODE_ENV: process.env.NODE_ENV,
      },
    }, { status: 500 });
  }

  try {
    console.log('Testing connection to:', webhookUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cabuetia-Test/1.0',
      },
      body: JSON.stringify({
        test: true,
        event: 'connection_test',
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    const responseText = await response.text().catch(() => '');
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('Response status:', response.status);
    console.log('Response time:', duration, 'ms');
    console.log('Response:', responseData);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      webhookUrl: webhookUrl.replace(/\/[^/]+$/, '/***'), // Hide ID
      response: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    }, { status: 200 });

  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    
    console.error('Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: isTimeout ? 'Connection timeout (>10s)' : 'Connection failed',
      details: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : typeof error,
      webhookUrl: webhookUrl.replace(/\/[^/]+$/, '/***'), // Hide ID
      suggestions: [
        isTimeout ? 'n8n may be down or slow' : 'Check if n8n is running',
        'Verify webhook URL is correct',
        'Check firewall/network settings',
        'Verify n8n workflow is active',
      ],
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
