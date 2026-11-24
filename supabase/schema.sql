-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > colar > Run

create extension if not exists pgcrypto;

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  criado_em timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo text not null,
  formato text not null default 'feed',
  legenda text,
  data_publicacao date,
  midias jsonb not null default '[]',
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'ajuste')),
  criado_em timestamptz not null default now()
);

create table if not exists comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  autor text not null check (autor in ('cliente', 'philar')),
  texto text not null,
  criado_em timestamptz not null default now()
);

-- Segurança: ninguém acessa as tabelas direto do navegador.
-- Tudo passa pelo servidor do site, que confere o link secreto de cada cliente.
alter table clientes enable row level security;
alter table posts enable row level security;
alter table comentarios enable row level security;

-- Pasta privada para as imagens e vídeos
insert into storage.buckets (id, name, public)
values ('midias', 'midias', false)
on conflict (id) do nothing;
