import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { db } from './supabase';

// Cliente do Supabase que lê/grava a sessão de login nos cookies do navegador.
export async function authClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Em páginas (só leitura) não dá para gravar cookie; o middleware cuida disso.
          }
        },
      },
    }
  );
}

// Quem está logado agora (ou null). Só vale se a pessoa estiver na tabela "equipe".
export async function membroAtual() {
  const supa = await authClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;
  const { data } = await db().from('equipe').select('*').eq('user_id', user.id).maybeSingle();
  return data ? { ...data, email: user.email } : null;
}

export async function exigirEquipe({ permitirTrocaDeSenha = false } = {}) {
  const membro = await membroAtual();
  if (!membro) redirect('/admin/login');
  if (membro.trocar_senha && !permitirTrocaDeSenha) redirect('/admin/conta');
  return membro;
}

export async function exigirDona() {
  const membro = await exigirEquipe();
  if (membro.papel !== 'dona') redirect('/admin');
  return membro;
}

export async function equipeVazia() {
  const { count } = await db().from('equipe').select('user_id', { count: 'exact', head: true });
  return !count;
}
