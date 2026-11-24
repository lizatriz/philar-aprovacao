'use client';

import { createClient } from '@supabase/supabase-js';
import { prepararUploads, prepararUploadLogo, salvarLogo } from '@/app/actions';

let cliente;
function supa() {
  if (!cliente) {
    cliente = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return cliente;
}

// Envia os arquivos direto do navegador para o Supabase, na ordem escolhida.
export async function enviarArquivos(clienteId, arquivos, aoProgredir) {
  const lista = Array.from(arquivos);
  const autorizacoes = await prepararUploads(
    clienteId,
    lista.map((f) => ({ nome: f.name, tipo: f.type.startsWith('video') ? 'video' : 'imagem' }))
  );
  const midias = [];
  for (let i = 0; i < lista.length; i++) {
    aoProgredir?.(i + 1, lista.length);
    const { path, token, tipo } = autorizacoes[i];
    const { error } = await supa()
      .storage.from('midias')
      .uploadToSignedUrl(path, token, lista[i], { contentType: lista[i].type });
    if (error) throw new Error(`Falha ao enviar "${lista[i].name}": ${error.message}`);
    midias.push({ path, tipo });
  }
  return midias;
}

// Envia um logo (alvo = 'agencia' ou id do cliente)
export async function enviarLogo(alvo, arquivo) {
  const { path, token } = await prepararUploadLogo(alvo, arquivo.name);
  const { error } = await supa()
    .storage.from('midias')
    .uploadToSignedUrl(path, token, arquivo, { contentType: arquivo.type });
  if (error) throw new Error(`Falha ao enviar o logo: ${error.message}`);
  await salvarLogo(alvo, path);
}
