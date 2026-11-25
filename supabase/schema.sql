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

-- Permissão só para o servidor do site (chave secreta)
grant usage on schema public to service_role;
grant all on table clientes, posts, comentarios to service_role;

-- Pasta privada para as imagens e vídeos
insert into storage.buckets (id, name, public)
values ('midias', 'midias', false)
on conflict (id) do nothing;

-- Logo de cada cliente
alter table clientes add column if not exists logo_path text;

-- Fase 1: logins individuais da equipe
create table if not exists equipe (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null default 'equipe' check (papel in ('dona', 'equipe')),
  trocar_senha boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table equipe enable row level security;
grant all on table equipe to service_role;

alter table posts add column if not exists criado_por uuid references equipe(user_id) on delete set null;
alter table comentarios add column if not exists membro_id uuid references equipe(user_id) on delete set null;

-- Fase 2: linha editorial, arquivos da marca e cofre de acessos
alter table clientes add column if not exists linha_editorial jsonb not null default '{}';
alter table clientes add column if not exists linha_atualizada_em timestamptz;
alter table clientes add column if not exists linha_atualizada_por uuid references equipe(user_id) on delete set null;

create table if not exists arquivos_marca (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  nome text not null,
  path text not null,
  tipo text,
  tamanho bigint,
  criado_por uuid references equipe(user_id) on delete set null,
  criado_em timestamptz not null default now()
);

create table if not exists acessos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  plataforma text not null,
  usuario text,
  senha_cifrada text not null,
  link text,
  observacoes text,
  criado_por uuid references equipe(user_id) on delete set null,
  atualizado_em timestamptz not null default now()
);

create table if not exists acessos_log (
  id uuid primary key default gen_random_uuid(),
  acesso_id uuid not null references acessos(id) on delete cascade,
  membro_id uuid references equipe(user_id) on delete set null,
  acao text not null,
  criado_em timestamptz not null default now()
);

alter table arquivos_marca enable row level security;
alter table acessos enable row level security;
alter table acessos_log enable row level security;
grant all on table arquivos_marca, acessos, acessos_log to service_role;
