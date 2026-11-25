'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { authClient, exigirDona, exigirEquipe, equipeVazia } from '@/lib/auth';

const SENHA_MINIMA = 8;
const limpar = (v) => String(v || '').trim();

/* ---------- Entrar / sair ---------- */

export async function entrar(_estado, formData) {
  const email = limpar(formData.get('email')).toLowerCase();
  const senha = String(formData.get('senha') || '');
  const supa = await authClient();
  const { data, error } = await supa.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: 'E-mail ou senha incorretos.' };

  const { data: membro } = await db().from('equipe').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!membro) {
    await supa.auth.signOut();
    return { erro: 'Essa conta não faz parte da equipe da Philar.' };
  }
  redirect('/admin');
}

export async function sair() {
  const supa = await authClient();
  await supa.auth.signOut();
  redirect('/admin/login');
}

// Primeira configuração: cria a conta da dona usando a ADMIN_PASSWORD como chave.
export async function criarContaDona(_estado, formData) {
  if (!(await equipeVazia())) return { erro: 'A conta principal já foi criada. Faça login.' };
  if (!process.env.ADMIN_PASSWORD || String(formData.get('chave') || '') !== process.env.ADMIN_PASSWORD) {
    return { erro: 'Chave de configuração incorreta (é a senha antiga do painel).' };
  }
  const nome = limpar(formData.get('nome'));
  const email = limpar(formData.get('email')).toLowerCase();
  const senha = String(formData.get('senha') || '');
  if (!nome || !email) return { erro: 'Preencha nome e e-mail.' };
  if (senha.length < SENHA_MINIMA) return { erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };

  const { data, error } = await db().auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error) return { erro: traduzirErro(error) };
  const { error: e2 } = await db().from('equipe').insert({
    user_id: data.user.id, nome, papel: 'dona', trocar_senha: false,
  });
  if (e2) return { erro: e2.message };

  const supa = await authClient();
  await supa.auth.signInWithPassword({ email, password: senha });
  redirect('/admin');
}

/* ---------- Minha conta ---------- */

export async function trocarMinhaSenha(_estado, formData) {
  const membro = await exigirEquipe({ permitirTrocaDeSenha: true });
  const senha = String(formData.get('senha') || '');
  const confirmar = String(formData.get('confirmar') || '');
  if (senha.length < SENHA_MINIMA) return { erro: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
  if (senha !== confirmar) return { erro: 'As senhas não são iguais.' };

  const { error } = await db().auth.admin.updateUserById(membro.user_id, { password: senha });
  if (error) return { erro: traduzirErro(error) };
  const precisavaTrocar = membro.trocar_senha;
  await db().from('equipe').update({ trocar_senha: false }).eq('user_id', membro.user_id);
  if (precisavaTrocar) redirect('/admin');
  return { ok: 'Senha alterada!' };
}

export async function trocarMeuNome(_estado, formData) {
  const membro = await exigirEquipe();
  const nome = limpar(formData.get('nome'));
  if (!nome) return { erro: 'Digite um nome.' };
  await db().from('equipe').update({ nome }).eq('user_id', membro.user_id);
  revalidatePath('/admin', 'layout');
  return { ok: 'Nome atualizado!' };
}

/* ---------- Gestão da equipe (só a dona) ---------- */

export async function adicionarMembro(_estado, formData) {
  await exigirDona();
  const nome = limpar(formData.get('nome'));
  const email = limpar(formData.get('email')).toLowerCase();
  const senha = String(formData.get('senha') || '');
  if (!nome || !email) return { erro: 'Preencha nome e e-mail.' };
  if (senha.length < SENHA_MINIMA) return { erro: `A senha provisória precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };

  const { data, error } = await db().auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error) return { erro: traduzirErro(error) };
  const { error: e2 } = await db().from('equipe').insert({
    user_id: data.user.id, nome, papel: 'equipe', trocar_senha: true,
  });
  if (e2) {
    await db().auth.admin.deleteUser(data.user.id);
    return { erro: e2.message };
  }
  revalidatePath('/admin/equipe');
  return { ok: `${nome} foi adicionada! Envie o e-mail e a senha provisória para ela.` };
}

export async function redefinirSenha(userId, novaSenha) {
  const dona = await exigirDona();
  if (userId === dona.user_id) return { erro: 'Para mudar a sua senha, use "Minha conta".' };
  if (String(novaSenha || '').length < SENHA_MINIMA) return { erro: `Mínimo de ${SENHA_MINIMA} caracteres.` };
  const { error } = await db().auth.admin.updateUserById(userId, { password: novaSenha });
  if (error) return { erro: traduzirErro(error) };
  await db().from('equipe').update({ trocar_senha: true }).eq('user_id', userId);
  revalidatePath('/admin/equipe');
  return { ok: 'Senha provisória definida.' };
}

export async function alterarPapel(userId, papel) {
  const dona = await exigirDona();
  if (userId === dona.user_id) return;
  if (!['dona', 'equipe'].includes(papel)) return;
  await db().from('equipe').update({ papel }).eq('user_id', userId);
  revalidatePath('/admin/equipe');
}

export async function removerMembro(userId) {
  const dona = await exigirDona();
  if (userId === dona.user_id) return;
  await db().auth.admin.deleteUser(userId); // a linha em "equipe" some junto
  revalidatePath('/admin/equipe');
}

function traduzirErro(error) {
  const m = String(error?.message || '');
  if (/already.*registered|already exists/i.test(m)) return 'Já existe uma conta com esse e-mail.';
  if (/password/i.test(m)) return 'Senha fraca demais. Use letras e números, com pelo menos 8 caracteres.';
  if (/email/i.test(m)) return 'E-mail inválido.';
  return m || 'Algo deu errado.';
}
