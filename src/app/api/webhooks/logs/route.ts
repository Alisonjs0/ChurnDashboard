import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for webhook logs (in production, use a database)
let webhookLogs: Array<{
  id: string;
  timestamp: string;
  type: 'sent' | 'received' | 'error';
  status: number | string;
  clientId: string;
  clientName: string;
  endpoint: string;
  message?: string;
  error?: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, clientId, clientName, endpoint, status, message, error } =
      body;

    // Validations
    if (!type || !['sent', 'received', 'error'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid log type. Must be: sent, received, or error',
        },
        { status: 400 }
      );
    }

    if (!clientId || !clientName || !endpoint) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: clientId, clientName, endpoint',
        },
        { status: 400 }
      );
    }

    // Create log record
    const logRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      status: status || (type === 'error' ? 'error' : 'success'),
      clientId,
      clientName,
      endpoint,
      message,
      error,
    };

    // Store in memory
    webhookLogs.push(logRecord);

    // Keep only last 500 logs to prevent memory issues
    if (webhookLogs.length > 500) {
      webhookLogs = webhookLogs.slice(-500);
    }

    console.log(`[WEBHOOK LOG] ${type.toUpperCase()}:`, logRecord);

    return NextResponse.json(
      {
        success: true,
        message: 'Log recorded successfully',
        logId: logRecord.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[WEBHOOK] Error recording log:', error);
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
    const type = searchParams.get('type');
    const clientId = searchParams.get('clientId');
    const endpoint = searchParams.get('endpoint');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let filtered = [...webhookLogs];

    // Apply filters
    if (type) {
      filtered = filtered.filter((log) => log.type === type);
    }

    if (clientId) {
      filtered = filtered.filter((log) => log.clientId === clientId);
    }

    if (endpoint) {
      filtered = filtered.filter((log) => log.endpoint.includes(endpoint));
    }

    // Sort by most recent first
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    const total = filtered.length;
    const logs = filtered.slice(offset, offset + limit);

    // Calculate statistics
    const stats = {
      total: filtered.length,
      sent: filtered.filter((l) => l.type === 'sent').length,
      received: filtered.filter((l) => l.type === 'received').length,
      errors: filtered.filter((l) => l.type === 'error').length,
    };

    return NextResponse.json(
      {
        success: true,
        stats,
        pagination: {
          limit,
          offset,
          total,
          count: logs.length,
        },
        data: logs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[WEBHOOK] Error retrieving logs:', error);
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
    const type = searchParams.get('type');

    const initialCount = webhookLogs.length;

    if (type) {
      webhookLogs = webhookLogs.filter((log) => log.type !== type);
    } else {
      webhookLogs = [];
    }

    const deletedCount = initialCount - webhookLogs.length;

    return NextResponse.json(
      {
        success: true,
        message: `${deletedCount} log(s) deleted successfully`,
        deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[WEBHOOK] Error deleting logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
