'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, BUCKET, clientePorToken } from '@/lib/supabase';
import { exigirEquipe, exigirDona } from '@/lib/auth';

// Logo da agência e exclusão de clientes: só a dona. O resto: toda a equipe.
const exigirParaLogo = (alvo) => (alvo === 'agencia' ? exigirDona() : exigirEquipe());

/* ---------- Ações da Philar (admin) ---------- */

export async function criarCliente(formData) {
  await exigirEquipe();
  const nome = String(formData.get('nome') || '').trim();
  if (!nome) return;
  const { data, error } = await db().from('clientes').insert({ nome }).select().single();
  if (error) throw error;
  redirect(`/admin/${data.id}`);
}

export async function excluirCliente(clienteId) {
  await exigirDona();
  const supa = db();
  const { data: posts } = await supa.from('posts').select('midias').eq('cliente_id', clienteId);
  const { data: cli } = await supa.from('clientes').select('logo_path').eq('id', clienteId).single();
  const { data: marca } = await supa.from('arquivos_marca').select('path').eq('cliente_id', clienteId);
  const paths = (posts || []).flatMap((p) => p.midias.map((m) => m.path));
  (marca || []).forEach((a) => paths.push(a.path));
  if (cli?.logo_path) paths.push(cli.logo_path);
  if (paths.length) await supa.storage.from(BUCKET).remove(paths);
  await supa.from('clientes').delete().eq('id', clienteId);
  redirect('/admin');
}

export async function gerarLinkNovo(clienteId) {
  await exigirEquipe();
  const token = crypto.randomBytes(16).toString('hex');
  await db().from('clientes').update({ token }).eq('id', clienteId);
  revalidatePath(`/admin/${clienteId}`);
}

// Gera "autorizações" para o navegador enviar os arquivos direto ao Supabase
// (assim vídeos grandes não passam pelo servidor da Vercel, que tem limite de tamanho).
export async function prepararUploads(clienteId, arquivos) {
  await exigirEquipe();
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

/* ---------- Logos ---------- */

// alvo = 'agencia' ou o id de um cliente
export async function prepararUploadLogo(alvo, nomeArquivo) {
  await exigirParaLogo(alvo);
  const ext = (nomeArquivo.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const pasta = alvo === 'agencia' ? 'marca' : alvo;
  const path = `${pasta}/logo-${crypto.randomUUID()}.${ext}`;
  const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path, token: data.token };
}

export async function salvarLogo(alvo, path) {
  await exigirParaLogo(alvo);
  const supa = db();
  if (alvo === 'agencia') {
    // apaga logos antigos da agência
    const { data } = await supa.storage.from(BUCKET).list('marca', { limit: 100 });
    const antigos = (data || [])
      .filter((f) => f.name?.startsWith('logo-') && `marca/${f.name}` !== path)
      .map((f) => `marca/${f.name}`);
    if (antigos.length) await supa.storage.from(BUCKET).remove(antigos);
    revalidatePath('/', 'layout');
    return;
  }
  const { data: cliente } = await supa.from('clientes').select('logo_path').eq('id', alvo).single();
  await supa.from('clientes').update({ logo_path: path }).eq('id', alvo);
  if (cliente?.logo_path && cliente.logo_path !== path) {
    await supa.storage.from(BUCKET).remove([cliente.logo_path]);
  }
  revalidatePath('/', 'layout');
}

export async function removerLogo(alvo) {
  await exigirParaLogo(alvo);
  const supa = db();
  if (alvo === 'agencia') {
    const { data } = await supa.storage.from(BUCKET).list('marca', { limit: 100 });
    const todos = (data || []).filter((f) => f.name?.startsWith('logo-')).map((f) => `marca/${f.name}`);
    if (todos.length) await supa.storage.from(BUCKET).remove(todos);
  } else {
    const { data: cliente } = await supa.from('clientes').select('logo_path').eq('id', alvo).single();
    if (cliente?.logo_path) await supa.storage.from(BUCKET).remove([cliente.logo_path]);
    await supa.from('clientes').update({ logo_path: null }).eq('id', alvo);
  }
  revalidatePath('/', 'layout');
}

export async function criarPost(clienteId, dados) {
  const membro = await exigirEquipe();
  const { error } = await db().from('posts').insert({
    cliente_id: clienteId,
    criado_por: membro.user_id,
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
  const membro = await exigirEquipe();
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
    post_id: postId, autor: 'philar', membro_id: membro.user_id, texto: 'Nova versão enviada para aprovação.',
  });
  revalidatePath(`/admin/${post.cliente_id}`);
}

export async function excluirPost(postId) {
  await exigirEquipe();
  const supa = db();
  const { data: post } = await supa.from('posts').select('cliente_id, midias').eq('id', postId).single();
  if (!post) return;
  const paths = post.midias.map((m) => m.path);
  if (paths.length) await supa.storage.from(BUCKET).remove(paths);
  await supa.from('posts').delete().eq('id', postId);
  revalidatePath(`/admin/${post.cliente_id}`);
}

export async function comentarComoPhilar(postId, texto) {
  const membro = await exigirEquipe();
  texto = String(texto || '').trim();
  if (!texto) return;
  const supa = db();
  const { data: post } = await supa.from('posts').select('cliente_id').eq('id', postId).single();
  if (!post) return;
  await supa.from('comentarios').insert({ post_id: postId, autor: 'philar', membro_id: membro.user_id, texto });
  revalidatePath(`/admin/${post.cliente_id}`);
}

export async function voltarParaPendente(postId) {
  await exigirEquipe();
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
