'use server';

import { revalidatePath } from 'next/cache';
import { db, clientePorToken } from '@/lib/supabase';
import { exigirEquipe } from '@/lib/auth';
import { FORMATOS_PAUTA, STATUS_PAUTA, OBJETIVOS } from '@/lib/pautas';

const limpar = (v, max = 5000) => String(v ?? '').trim().slice(0, max);
const atualizar = (clienteId, token) => {
  revalidatePath(`/admin/${clienteId}`);
  if (token) revalidatePath(`/c/${token}`);
};

/* ---------- Equipe ---------- */

export async function salvarPauta(clienteId, dados) {
  const membro = await exigirEquipe();
  const titulo = limpar(dados.titulo, 200);
  if (!titulo) return { erro: 'Dê um título para a pauta.' };
  const registro = {
    titulo,
    data: dados.data || null,
    formato: FORMATOS_PAUTA[dados.formato] ? dados.formato : 'carrossel',
    status: STATUS_PAUTA[dados.status] ? dados.status : 'rascunho',
    pilar: limpar(dados.pilar, 80) || null,
    objetivo: OBJETIVOS.includes(dados.objetivo) ? dados.objetivo : null,
    blocos: (Array.isArray(dados.blocos) ? dados.blocos : []).map((b) => limpar(b)).slice(0, 30),
    legenda: limpar(dados.legenda, 5000),
    notas: limpar(dados.notas, 5000),
    atualizado_por: membro.user_id,
    atualizado_em: new Date().toISOString(),
  };
  const supa = db();

  if (dados.id) {
    const { data: atual } = await supa.from('pautas').select('aprovacao, blocos, legenda').eq('id', dados.id).single();
    const copyMudou = atual && (JSON.stringify(atual.blocos) !== JSON.stringify(registro.blocos) || (atual.legenda || '') !== registro.legenda);
    // Se o cliente pediu ajuste (ou já tinha aprovado) e a copy mudou, volta para aprovação
    if (atual && copyMudou && atual.aprovacao !== 'pendente') {
      registro.aprovacao = 'pendente';
      await supa.from('pauta_comentarios').insert({
        pauta_id: dados.id, autor: 'philar', membro_id: membro.user_id, texto: 'Copy atualizada. Pode dar uma olhada de novo?',
      });
    }
    const { error } = await supa.from('pautas').update(registro).eq('id', dados.id).eq('cliente_id', clienteId);
    if (error) return { erro: error.message };
  } else {
    const { error } = await supa.from('pautas').insert({
      ...registro, cliente_id: clienteId, criado_por: membro.user_id, interno: !!dados.interno,
    });
    if (error) return { erro: error.message };
  }
  atualizar(clienteId);
  return { ok: true };
}

export async function mudarStatusPauta(pautaId, status) {
  const membro = await exigirEquipe();
  if (!STATUS_PAUTA[status]) return;
  const { data } = await db().from('pautas')
    .update({ status, atualizado_por: membro.user_id, atualizado_em: new Date().toISOString() })
    .eq('id', pautaId).select('cliente_id').single();
  if (data) atualizar(data.cliente_id);
}

// Move entre o quadro interno e as pautas do cliente
export async function moverPauta(pautaId, interno) {
  const membro = await exigirEquipe();
  const { data } = await db().from('pautas')
    .update({ interno: !!interno, atualizado_por: membro.user_id, atualizado_em: new Date().toISOString() })
    .eq('id', pautaId).select('cliente_id').single();
  if (data) atualizar(data.cliente_id);
}

export async function excluirPauta(pautaId) {
  await exigirEquipe();
  const { data } = await db().from('pautas').delete().eq('id', pautaId).select('cliente_id').single();
  if (data) atualizar(data.cliente_id);
}

export async function comentarPautaEquipe(pautaId, texto) {
  const membro = await exigirEquipe();
  texto = limpar(texto, 3000);
  if (!texto) return;
  const supa = db();
  const { data: pauta } = await supa.from('pautas').select('cliente_id').eq('id', pautaId).single();
  if (!pauta) return;
  await supa.from('pauta_comentarios').insert({ pauta_id: pautaId, autor: 'philar', membro_id: membro.user_id, texto });
  atualizar(pauta.cliente_id);
}

/* ---------- Cliente (pelo link secreto) ---------- */

async function pautaDoCliente(token, pautaId) {
  const cliente = await clientePorToken(token);
  if (!cliente) throw new Error('Link inválido');
  const { data } = await db().from('pautas').select('id')
    .eq('id', pautaId).eq('cliente_id', cliente.id).eq('interno', false).neq('status', 'rascunho')
    .maybeSingle();
  if (!data) throw new Error('Pauta não encontrada');
  return cliente;
}

export async function aprovarCopy(token, pautaId) {
  const cliente = await pautaDoCliente(token, pautaId);
  await db().from('pautas').update({ aprovacao: 'aprovada' }).eq('id', pautaId);
  atualizar(cliente.id, token);
}

export async function pedirAjusteCopy(token, pautaId, texto) {
  texto = limpar(texto, 3000);
  if (!texto) return;
  const cliente = await pautaDoCliente(token, pautaId);
  const supa = db();
  await supa.from('pauta_comentarios').insert({ pauta_id: pautaId, autor: 'cliente', texto });
  await supa.from('pautas').update({ aprovacao: 'ajuste' }).eq('id', pautaId);
  atualizar(cliente.id, token);
}

export async function comentarPautaCliente(token, pautaId, texto) {
  texto = limpar(texto, 3000);
  if (!texto) return;
  const cliente = await pautaDoCliente(token, pautaId);
  await db().from('pauta_comentarios').insert({ pauta_id: pautaId, autor: 'cliente', texto });
  atualizar(cliente.id, token);
}
