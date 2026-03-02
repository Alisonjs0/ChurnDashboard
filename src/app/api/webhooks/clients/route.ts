import { NextRequest, NextResponse } from 'next/server';
import { getClientsFromChurnDashboard, getClientFromChurnDashboard } from '@/lib/chat-storage';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Internal server error';
  }
}

function isMissingClientsTableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = getErrorMessage(error);
  return code === '42P01' || message.includes('relation') && message.includes('does not exist');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const client = await getClientFromChurnDashboard(clientId);

      if (!client) {
        return NextResponse.json(
          {
            success: false,
            error: 'Client not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: client,
        },
        { status: 200 }
      );
    }

    const clients = await getClientsFromChurnDashboard();

    return NextResponse.json(
      {
        success: true,
        count: clients.length,
        data: clients,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    if (errorMessage.includes('Supabase not configured')) {
      return NextResponse.json(
        {
          success: true,
          message: 'Supabase ainda não configurado. Retornando clientes mock.',
          count: 0,
          data: [],
          warning: 'supabase_not_configured',
        },
        { status: 200 }
      );
    }

    if (isMissingClientsTableError(error)) {
      return NextResponse.json(
        {
          success: true,
          message: 'Tabela de clientes não encontrada no Supabase. Retornando vazio temporariamente.',
          count: 0,
          data: [],
          warning: 'clients_table_missing',
        },
        { status: 200 }
      );
    }

    console.error('[CLIENTS] Error retrieving clients:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
