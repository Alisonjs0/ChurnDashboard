import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Internal server error';
  }
}

// GET - Listar todas as solicitações ou de um cliente específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const isDelivered = searchParams.get('isDelivered');

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from('client_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtros
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (isDelivered !== null && isDelivered !== undefined) {
      query = query.eq('is_delivered', isDelivered === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[REQUESTS] Error fetching requests:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: data?.length || 0,
        data: data || [],
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[REQUESTS] Error:', error);

    if (errorMessage.includes('Supabase not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase não configurado. Configure as variáveis de ambiente.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POST - Criar uma nova solicitação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      client_id,
      client_name,
      title,
      description,
      request_type = 'general',
      priority = 'medium',
      assigned_to,
      due_date,
      notes,
    } = body;

    // Validações
    if (!client_id || !client_name || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'client_id, client_name e title são obrigatórios',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('client_requests')
      .insert({
        client_id,
        client_name,
        title,
        description,
        request_type,
        priority,
        assigned_to,
        due_date,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('[REQUESTS] Error creating request:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[REQUESTS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar uma solicitação (incluindo marcar como entregue)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID da solicitação é obrigatório',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      status,
      is_delivered,
      delivered_by,
      assigned_to,
      priority,
      description,
      notes,
      due_date,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (is_delivered !== undefined) updateData.is_delivered = is_delivered;
    if (delivered_by !== undefined) updateData.delivered_by = delivered_by;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (priority !== undefined) updateData.priority = priority;
    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;
    if (due_date !== undefined) updateData.due_date = due_date;

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('client_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('[REQUESTS] Error updating request:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[REQUESTS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// DELETE - Remover uma solicitação
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID da solicitação é obrigatório',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from('client_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('[REQUESTS] Error deleting request:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitação removida com sucesso',
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[REQUESTS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
