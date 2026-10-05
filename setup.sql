-- ============================================================
--  Griglia Serie C — setup database Supabase
--  Incolla tutto in: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Tabella unica che contiene tutti i dati del sito (formato JSON)
create table if not exists public.griglia (
  id          int primary key,
  contenuto   jsonb not null default '{}'::jsonb,
  aggiornato  timestamptz not null default now()
);

insert into public.griglia (id, contenuto) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- 2) Sicurezza: tutti possono LEGGERE, solo gli utenti registrati possono SCRIVERE
--    Scrive SOLO l'utente con questa email (cambiala qui sotto se ne usi un'altra)
alter table public.griglia enable row level security;

drop policy if exists "lettura pubblica" on public.griglia;
create policy "lettura pubblica" on public.griglia
  for select using (true);

drop policy if exists "scrittura admin" on public.griglia;
create policy "scrittura admin" on public.griglia
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'gianlucapalmisani04@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'gianlucapalmisani04@gmail.com');

drop policy if exists "inserimento admin" on public.griglia;
create policy "inserimento admin" on public.griglia
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'gianlucapalmisani04@gmail.com');

-- 3) Copia di sicurezza automatica: ogni salvataggio conserva la versione precedente
create table if not exists public.griglia_storico (
  id          bigint generated always as identity primary key,
  contenuto   jsonb,
  salvato     timestamptz default now()
);
alter table public.griglia_storico enable row level security;  -- nessuno la legge dal sito

create or replace function public.salva_storico() returns trigger
language plpgsql security definer as $$
begin
  insert into public.griglia_storico (contenuto) values (old.contenuto);
  new.aggiornato := now();
  return new;
end $$;

drop trigger if exists trg_storico on public.griglia;
create trigger trg_storico before update on public.griglia
  for each row execute function public.salva_storico();
