import 'server-only';
import { createClient } from '@supabase/supabase-js';

export const BUCKET = 'midias';

// Cliente com acesso total — só roda no servidor, nunca no navegador.
export function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Busca posts + comentários e gera links temporários (1h) para as mídias.
export async function carregarPosts(clienteId) {
  const supa = db();
  const { data: posts, error } = await supa
    .from('posts')
    .select('*, comentarios(*)')
    .eq('cliente_id', clienteId)
    .order('data_publicacao', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: true });
  if (error) throw error;

  const paths = posts.flatMap((p) => p.midias.map((m) => m.path));
  const urls = {};
  if (paths.length) {
    const { data } = await supa.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
    (data || []).forEach((d) => { if (d.signedUrl) urls[d.path] = d.signedUrl; });
  }

  return posts.map((p) => ({
    ...p,
    comentarios: [...p.comentarios].sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
    midias: p.midias.map((m) => ({ ...m, url: urls[m.path] || null })),
  }));
}

export async function clientePorToken(token) {
  const { data } = await db().from('clientes').select('*').eq('token', token).maybeSingle();
  return data;
}
