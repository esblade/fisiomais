-- Fisio+ · notificações push
-- Rode no SQL Editor DEPOIS de fisiomais.sql e de publicar a função "lembretes".
-- Antes de rodar, troque <CRON_SECRET> pelo valor do arquivo .segredos-supabase.txt.

-- ============ Aparelhos inscritos para receber avisos ============
create table if not exists fisiomais.push_inscricoes (
  user_id          uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint         text        primary key,
  p256dh           text        not null,
  auth             text        not null,
  resumo_hora      text        not null default '07:00',  -- hora do resumo do dia (horário de Maceió)
  antecedencia_min int         not null default 30,       -- aviso antes de cada atendimento
  criado_em        timestamptz not null default now()
);
alter table fisiomais.push_inscricoes enable row level security;

drop policy if exists "push: dono lê" on fisiomais.push_inscricoes;
create policy "push: dono lê" on fisiomais.push_inscricoes
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "push: dono cria" on fisiomais.push_inscricoes;
create policy "push: dono cria" on fisiomais.push_inscricoes
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "push: dono altera" on fisiomais.push_inscricoes;
create policy "push: dono altera" on fisiomais.push_inscricoes
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "push: dono remove" on fisiomais.push_inscricoes;
create policy "push: dono remove" on fisiomais.push_inscricoes
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on fisiomais.push_inscricoes to authenticated;

-- ============ Avisos já enviados (evita repetir) ============
-- Só a função do servidor (service role) usa esta tabela.
create table if not exists fisiomais.push_enviados (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  chave      text        not null,   -- "dia:2026-11-24" ou "at:<id>:<data> <hora>"
  enviado_em timestamptz not null default now(),
  primary key (user_id, chave)
);
alter table fisiomais.push_enviados enable row level security;
grant select, insert, delete on fisiomais.push_enviados to service_role;
grant select on fisiomais.push_inscricoes, fisiomais.atendimentos to service_role;
grant delete on fisiomais.push_inscricoes to service_role;
grant usage on schema fisiomais to service_role;

-- ============ Rodar a função a cada 5 minutos ============
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('fisiomais-lembretes')
where exists (select 1 from cron.job where jobname = 'fisiomais-lembretes');

select cron.schedule(
  'fisiomais-lembretes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://zemvlkrymvbbqikzcsqz.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body    := '{}'::jsonb
  );
  $$
);

-- Para conferir as execuções:
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select * from net._http_response order by created desc limit 10;
