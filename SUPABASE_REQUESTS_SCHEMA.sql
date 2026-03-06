-- Schema para gerenciamento de solicitações dos clientes
-- Permite rastrear pedidos, demandas e solicitações dos clientes
-- e marcar cada uma como entregue ou pendente

create table if not exists public.client_requests (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  client_name text not null,
  title text not null,
  description text,
  request_type text not null default 'general' check (request_type in ('technical', 'support', 'feature', 'configuration', 'access', 'general')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  is_delivered boolean not null default false,
  delivered_at timestamptz,
  delivered_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  assigned_to text,
  due_date timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

-- Índices para melhorar performance
create index if not exists idx_client_requests_client_id
  on public.client_requests (client_id);

create index if not exists idx_client_requests_status
  on public.client_requests (status);

create index if not exists idx_client_requests_is_delivered
  on public.client_requests (is_delivered);

create index if not exists idx_client_requests_created_at
  on public.client_requests (created_at desc);

create index if not exists idx_client_requests_client_status
  on public.client_requests (client_id, status);

-- Trigger para atualizar updated_at automaticamente
create or replace function update_client_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger client_requests_updated_at_trigger
  before update on public.client_requests
  for each row
  execute function update_client_requests_updated_at();

-- Trigger para atualizar delivered_at quando is_delivered é marcado como true
create or replace function update_client_requests_delivered_at()
returns trigger as $$
begin
  if new.is_delivered = true and old.is_delivered = false then
    new.delivered_at = now();
    if new.status = 'pending' or new.status = 'in_progress' then
      new.status = 'completed';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger client_requests_delivered_at_trigger
  before update on public.client_requests
  for each row
  execute function update_client_requests_delivered_at();

-- Row Level Security
alter table public.client_requests enable row level security;

create policy if not exists "client_requests_allow_all"
  on public.client_requests
  for all
  using (true)
  with check (true);

-- Comentários para documentação
comment on table public.client_requests is 'Tabela para gerenciar solicitações dos clientes';
comment on column public.client_requests.id is 'Identificador único da solicitação';
comment on column public.client_requests.client_id is 'ID do cliente que fez a solicitação';
comment on column public.client_requests.client_name is 'Nome do cliente';
comment on column public.client_requests.title is 'Título resumido da solicitação';
comment on column public.client_requests.description is 'Descrição detalhada da solicitação';
comment on column public.client_requests.request_type is 'Tipo da solicitação (technical, support, feature, configuration, access, general)';
comment on column public.client_requests.priority is 'Prioridade da solicitação (low, medium, high, urgent)';
comment on column public.client_requests.status is 'Status atual (pending, in_progress, completed, cancelled)';
comment on column public.client_requests.is_delivered is 'Indica se a solicitação foi entregue';
comment on column public.client_requests.delivered_at is 'Data e hora da entrega';
comment on column public.client_requests.delivered_by is 'Usuário que marcou como entregue';
comment on column public.client_requests.assigned_to is 'Responsável pela solicitação';
comment on column public.client_requests.due_date is 'Data limite para entrega';
comment on column public.client_requests.notes is 'Notas adicionais sobre a solicitação';
comment on column public.client_requests.metadata is 'Dados adicionais em formato JSON';
