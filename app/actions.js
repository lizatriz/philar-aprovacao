'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, BUCKET, clientePorToken } from '@/lib/supabase';
import { exigirAdmin, fazerLogin, fazerLogout } from '@/lib/auth';

/* ---------- Login ---------- */

export async function login(_estado, formData) {
  const ok = await fazerLogin(String(formData.get('senha') || ''));
  if (!ok) return { erro: 'Senha incorreta.' };
  redirect('/admin');
}

export async function sair() {
  await fazerLogout();
  redirect('/admin/login');
}

/* ---------- Ações da Philar (admin) ---------- */

export async function criarCliente(formData) {
  await exigirAdmin();
  const nome = String(formData.get('nome') || '').trim();
  if (!nome) return;
  const { data, error } = await db().from('clientes').insert({ nome }).select().single();
  if (error) throw error;
  redirect(`/admin/${data.id}`);
}

export async function excluirCliente(clienteId) {
  await exigirAdmin();
  const supa = db();
  const { data: posts } = await supa.from('posts').select('midias').eq('cliente_id', clienteId);
  const paths = (posts || []).flatMap((p) => p.midias.map((m) => m.path));
  if (paths.length) await supa.storage.from(BUCKET).remove(paths);
  await supa.from('clientes').delete().eq('id', clienteId);
  redirect('/admin');
}

export async function gerarLinkNovo(clienteId) {
  await exigirAdmin();
  const token = crypto.randomBytes(16).toString('hex');
  await db().from('clientes').update({ token }).eq('id', clienteId);
  revalidatePath(`/admin/${clienteId}`);
}

// Gera "autorizações" para o navegador enviar os arquivos direto ao Supabase
// (assim vídeos grandes não passam pelo servidor da Vercel, que tem limite de tamanho).
export async function prepararUploads(clienteId, arquivos) {
  await exigirAdmin();
  const supa = db();
  const resultado = [];
  for (const arq of arquivos) {
    const ext = (arq.nome.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${clienteId}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supa.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    resultado.push({ path, token: data.token, tipo: arq.tipo });
  }
  return resultado;
}

export async function criarPost(clienteId, dados) {
  await exigirAdmin();
  const { error } = await db().from('posts').insert({
    cliente_id: clienteId,
    titulo: dados.titulo,
    formato: dados.formato,
    legenda: dados.legenda || null,
    data_publicacao: dados.data_publicacao || null,
    midias: dados.midias,
  });
  if (error) throw error;
  revalidatePath(`/admin/${clienteId}`);
}

// Nova versão depois de um pedido de ajuste: troca legenda/data e, se vierem arquivos novos, as mídias.
export async function atualizarPost(postId, dados) {
  await exigirAdmin();
  const supa = db();
  const { data: post } = await supa.from('posts').select('cliente_id, midias').eq('id', postId).single();
  if (!post) return;
  const mudancas = {
    legenda: dados.legenda || null,
    data_publicacao: dados.data_publicacao || null,
    status: 'pendente',
  };
  if (dados.midias?.length) {
    mudancas.midias = dados.midias;
    const antigos = post.midias.map((m) => m.path);
    if (antigos.length) await supa.storage.from(BUCKET).remove(antigos);
  }
  await supa.from('posts').update(mudancas).eq('id', postId);
  await supa.from('comentarios').insert({
    post_id: postId, autor: 'philar', texto: 'Nova versão enviada para aprovação.',
  });
  revalidatePath(`/admin/${post.cliente_id}`);
}

export async function excluirPost(postId) {
  await exigirAdmin();
  const supa = db();
  const { data: post } = await supa.from('posts').select('cliente_id, midias').eq('id', postId).single();
  if (!post) return;
  const paths = post.midias.map((m) => m.path);
  if (paths.length) await supa.storage.from(BUCKET).remove(paths);
  await supa.from('posts').delete().eq('id', postId);
  revalidatePath(`/admin/${post.cliente_id}`);
}

export async function comentarComoPhilar(postId, texto) {
  await exigirAdmin();
  texto = String(texto || '').trim();
  if (!texto) return;
  const supa = db();
  const { data: post } = await supa.from('posts').select('cliente_id').eq('id', postId).single();
  if (!post) return;
  await supa.from('comentarios').insert({ post_id: postId, autor: 'philar', texto });
  revalidatePath(`/admin/${post.cliente_id}`);
}

export async function voltarParaPendente(postId) {
  await exigirAdmin();
  const supa = db();
  const { data: post } = await supa.from('posts').select('cliente_id').eq('id', postId).single();
  if (!post) return;
  await supa.from('posts').update({ status: 'pendente' }).eq('id', postId);
  revalidatePath(`/admin/${post.cliente_id}`);
}

/* ---------- Ações do cliente (pelo link secreto) ---------- */

async function postDoCliente(token, postId) {
  const cliente = await clientePorToken(token);
  if (!cliente) throw new Error('Link inválido');
  const { data: post } = await db()
    .from('posts').select('id').eq('id', postId).eq('cliente_id', cliente.id).maybeSingle();
  if (!post) throw new Error('Post não encontrado');
  return cliente;
}

export async function aprovar(token, postId) {
  await postDoCliente(token, postId);
  await db().from('posts').update({ status: 'aprovado' }).eq('id', postId);
  revalidatePath(`/c/${token}`);
}

export async function pedirAjuste(token, postId, texto) {
  texto = String(texto || '').trim();
  if (!texto) return;
  await postDoCliente(token, postId);
  const supa = db();
  await supa.from('comentarios').insert({ post_id: postId, autor: 'cliente', texto });
  await supa.from('posts').update({ status: 'ajuste' }).eq('id', postId);
  revalidatePath(`/c/${token}`);
}

export async function comentarComoCliente(token, postId, texto) {
  texto = String(texto || '').trim();
  if (!texto) return;
  await postDoCliente(token, postId);
  await db().from('comentarios').insert({ post_id: postId, autor: 'cliente', texto });
  revalidatePath(`/c/${token}`);
}
