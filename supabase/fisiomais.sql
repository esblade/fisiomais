-- Fisio+ · tabelas para sincronizar a agenda
-- Rode no Supabase em SQL Editor. Se o seu schema tiver outro nome,
-- troque "fisiomais" em todo o arquivo (e em config.js).
--
-- Cada linha guarda um registro do app (atendimento ou tipo de atendimento)
-- em "dados" (JSON). Só a conta dona enxerga e altera as próprias linhas.

create schema if not exists fisiomais;
grant usage on schema fisiomais to authenticated;

-- Marca a hora (do servidor) em que a linha mudou; o app usa isso para
-- baixar só o que mudou desde a última sincronização.
create or replace function fisiomais.marcar_alteracao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.alterado_em := now();
  return new;
end;
$$;

-- ============ Atendimentos ============
create table if not exists fisiomais.atendimentos (
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id            text        not null,
  dados         jsonb       not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),  -- quando foi alterado no aparelho
  alterado_em   timestamptz not null default now(),  -- quando chegou no servidor
  excluido      boolean     not null default false,
  primary key (user_id, id)
);
create index if not exists atendimentos_alterado_idx on fisiomais.atendimentos (user_id, alterado_em);

drop trigger if exists atendimentos_alteracao on fisiomais.atendimentos;
create trigger atendimentos_alteracao
  before insert or update on fisiomais.atendimentos
  for each row execute function fisiomais.marcar_alteracao();

alter table fisiomais.atendimentos enable row level security;

drop policy if exists "atendimentos: dono lê" on fisiomais.atendimentos;
create policy "atendimentos: dono lê" on fisiomais.atendimentos
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "atendimentos: dono cria" on fisiomais.atendimentos;
create policy "atendimentos: dono cria" on fisiomais.atendimentos
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "atendimentos: dono altera" on fisiomais.atendimentos;
create policy "atendimentos: dono altera" on fisiomais.atendimentos
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update on fisiomais.atendimentos to authenticated;

-- ============ Tipos de atendimento ============
create table if not exists fisiomais.servicos (
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id            text        not null,
  dados         jsonb       not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  alterado_em   timestamptz not null default now(),
  excluido      boolean     not null default false,
  primary key (user_id, id)
);
create index if not exists servicos_alterado_idx on fisiomais.servicos (user_id, alterado_em);

drop trigger if exists servicos_alteracao on fisiomais.servicos;
create trigger servicos_alteracao
  before insert or update on fisiomais.servicos
  for each row execute function fisiomais.marcar_alteracao();

alter table fisiomais.servicos enable row level security;

drop policy if exists "servicos: dono lê" on fisiomais.servicos;
create policy "servicos: dono lê" on fisiomais.servicos
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "servicos: dono cria" on fisiomais.servicos;
create policy "servicos: dono cria" on fisiomais.servicos
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "servicos: dono altera" on fisiomais.servicos;
create policy "servicos: dono altera" on fisiomais.servicos
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update on fisiomais.servicos to authenticated;

-- Excluir no app não apaga a linha: marca excluido = true, para os outros
-- aparelhos também removerem. Por isso não há permissão de DELETE.
