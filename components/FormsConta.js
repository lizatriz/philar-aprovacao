'use client';

import { useActionState } from 'react';
import { trocarMinhaSenha, trocarMeuNome } from '@/app/equipe-actions';

export function FormSenha({ obrigatoria }) {
  const [estado, acao, enviando] = useActionState(trocarMinhaSenha, null);
  return (
    <form action={acao} className="caixa">
      <h3 style={{ marginBottom: 16 }}>{obrigatoria ? 'Criar minha senha' : 'Trocar senha'}</h3>
      <div className="campo">
        <label htmlFor="senha">Nova senha (mínimo 8 caracteres)</label>
        <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="campo">
        <label htmlFor="confirmar">Repita a nova senha</label>
        <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {estado?.erro && <p className="erro">{estado.erro}</p>}
      {estado?.ok && <p className="sucesso">{estado.ok}</p>}
      <button className="btn" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar senha'}</button>
    </form>
  );
}

export function FormNome({ nomeAtual }) {
  const [estado, acao, enviando] = useActionState(trocarMeuNome, null);
  return (
    <form action={acao} className="caixa">
      <h3 style={{ marginBottom: 16 }}>Meu nome</h3>
      <div className="campo">
        <label htmlFor="nome">Como aparece para a equipe</label>
        <input id="nome" name="nome" defaultValue={nomeAtual} required />
      </div>
      {estado?.erro && <p className="erro">{estado.erro}</p>}
      {estado?.ok && <p className="sucesso">{estado.ok}</p>}
      <button className="btn" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar nome'}</button>
    </form>
  );
}
