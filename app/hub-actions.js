'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { db, BUCKET } from '@/lib/supabase';
import { exigirEquipe } from '@/lib/auth';
import { cifrar, decifrar } from '@/lib/cofre';
import { CAMPOS_LINHA } from '@/lib/linha';

const limpar = (v) => String(v ?? '').trim();
const pagina = (clienteId) => revalidatePath(`/admin/${clienteId}`);

/* ---------- Linha editorial ---------- */

export async function salvarLinhaEditorial(clienteId, campos) {
  const membro = await exigirEquipe();
  const linha = {};
  CAMPOS_LINHA.forEach((c) => { linha[c] = String(campos?.[c] ?? '').slice(0, 10000); });
  const { error } = await db().from('clientes').update({
    linha_editorial: linha,
    linha_atualizada_em: new Date().toISOString(),
    linha_atualizada_por: membro.user_id,
  }).eq('id', clienteId);
  if (error) return { erro: error.message };
  pagina(clienteId);
  return { ok: true };
}

/* ---------- Arquivos da marca ---------- */

export async function prepararUploadsMarca(clienteId, arquivos) {
  await exigirEquipe();
  const supa = db();
  const resultado = [];
  for (const arq of arquivos) {
    const ext = (arq.nome.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${clienteId}/marca/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supa.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    resultado.push({ path, token: data.token });
  }
  return resultado;
}

export async function registrarArquivosMarca(clienteId, arquivos) {
  const membro = await exigirEquipe();
  const linhas = arquivos.map((a) => ({
    cliente_id: clienteId,
    nome: limpar(a.nome).slice(0, 200) || 'arquivo',
    path: a.path,
    tipo: limpar(a.tipo).slice(0, 100),
    tamanho: Number(a.tamanho) || 0,
    criado_por: membro.user_id,
  }));
  const { error } = await db().from('arquivos_marca').insert(linhas);
  if (error) throw new Error(error.message);
  pagina(clienteId);
}

export async function excluirArquivoMarca(arquivoId) {
  await exigirEquipe();
  const supa = db();
  const { data: arq } = await supa.from('arquivos_marca').select('cliente_id, path').eq('id', arquivoId).single();
  if (!arq) return;
  await supa.storage.from(BUCKET).remove([arq.path]);
  await supa.from('arquivos_marca').delete().eq('id', arquivoId);
  pagina(arq.cliente_id);
}

/* ---------- Cofre de acessos ---------- */

async function registrar(acessoId, membroId, acao) {
  await db().from('acessos_log').insert({ acesso_id: acessoId, membro_id: membroId, acao });
}

export async function salvarAcesso(clienteId, dados) {
  const membro = await exigirEquipe();
  const plataforma = limpar(dados.plataforma);
  if (!plataforma) return { erro: 'Escolha a plataforma.' };
  const registro = {
    plataforma: plataforma.slice(0, 80),
    usuario: limpar(dados.usuario).slice(0, 300),
    link: limpar(dados.link).slice(0, 500),
    observacoes: limpar(dados.observacoes).slice(0, 2000),
    atualizado_em: new Date().toISOString(),
  };
  try {
    // senha vazia na edição = manter a atual
    if (dados.senha) registro.senha_cifrada = cifrar(dados.senha);
  } catch (e) {
    return { erro: e.message };
  }

  const supa = db();
  if (dados.id) {
    const { error } = await supa.from('acessos').update(registro).eq('id', dados.id).eq('cliente_id', clienteId);
    if (error) return { erro: error.message };
    await registrar(dados.id, membro.user_id, dados.senha ? 'alterou a senha' : 'editou');
  } else {
    if (!dados.senha) return { erro: 'Digite a senha.' };
    const { data, error } = await supa.from('acessos')
      .insert({ ...registro, cliente_id: clienteId, criado_por: membro.user_id })
      .select('id').single();
    if (error) return { erro: error.message };
    await registrar(data.id, membro.user_id, 'cadastrou');
  }
  pagina(clienteId);
  return { ok: true };
}

export async function excluirAcesso(acessoId) {
  await exigirEquipe();
  const supa = db();
  const { data } = await supa.from('acessos').select('cliente_id').eq('id', acessoId).single();
  if (!data) return;
  await supa.from('acessos').delete().eq('id', acessoId);
  pagina(data.cliente_id);
}

// Só aqui a senha é decifrada — e cada visualização/cópia fica registrada.
export async function revelarSenha(acessoId, motivo) {
  const membro = await exigirEquipe();
  const { data } = await db().from('acessos').select('senha_cifrada').eq('id', acessoId).single();
  if (!data?.senha_cifrada) return { erro: 'Senha não encontrada.' };
  try {
    const senha = decifrar(data.senha_cifrada);
    await registrar(acessoId, membro.user_id, motivo === 'copiou' ? 'copiou a senha' : 'viu a senha');
    return { senha };
  } catch {
    return { erro: 'Não foi possível abrir esta senha. A chave do cofre mudou?' };
  }
}
