'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions';

import LogoAgencia from './LogoAgencia';

export default function FormLogin({ logoUrl }) {
  const [estado, acao, enviando] = useActionState(login, null);
  return (
    <main className="pagina" style={{ maxWidth: 420, paddingTop: 100 }}>
      <LogoAgencia url={logoUrl} />
      <h1 style={{ margin: '6px 0 24px' }}>Área da agência</h1>
      <form action={acao} className="caixa">
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" name="senha" type="password" autoFocus required />
        </div>
        {estado?.erro && <p className="erro">{estado.erro}</p>}
        <button className="btn" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  );
}
