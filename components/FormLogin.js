'use client';

import { useActionState } from 'react';
import { entrar, criarContaDona } from '@/app/equipe-actions';
import LogoAgencia from './LogoAgencia';

export default function FormLogin({ logoUrl, primeiraVez }) {
  return (
    <main className="pagina" style={{ maxWidth: 440, paddingTop: 80 }}>
      <LogoAgencia url={logoUrl} />
      {primeiraVez ? <Configurar /> : <Entrar />}
    </main>
  );
}

function Entrar() {
  const [estado, acao, enviando] = useActionState(entrar, null);
  return (
    <>
      <h1 style={{ margin: '6px 0 24px' }}>Área da agência</h1>
      <form action={acao} className="caixa">
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" name="senha" type="password" autoComplete="current-password" required />
        </div>
        {estado?.erro && <p className="erro">{estado.erro}</p>}
        <button className="btn" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        <p className="sub" style={{ fontSize: 13, marginTop: 16 }}>
          Esqueceu a senha? Peça para a dona da agência definir uma nova.
        </p>
      </form>
    </>
  );
}

function Configurar() {
  const [estado, acao, enviando] = useActionState(criarContaDona, null);
  return (
    <>
      <h1 style={{ margin: '6px 0 8px' }}>Criar sua conta</h1>
      <p className="sub" style={{ marginBottom: 20 }}>
        Primeiro acesso com logins individuais. Esta será a conta principal da agência.
      </p>
      <form action={acao} className="caixa">
        <div className="campo">
          <label htmlFor="chave">Senha antiga do painel</label>
          <input id="chave" name="chave" type="password" required autoFocus />
        </div>
        <div className="campo">
          <label htmlFor="nome">Seu nome</label>
          <input id="nome" name="nome" autoComplete="name" required />
        </div>
        <div className="campo">
          <label htmlFor="email">Seu e-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="campo">
          <label htmlFor="senha">Nova senha (mínimo 8 caracteres)</label>
          <input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        {estado?.erro && <p className="erro">{estado.erro}</p>}
        <button className="btn" disabled={enviando}>{enviando ? 'Criando…' : 'Criar conta e entrar'}</button>
      </form>
    </>
  );
}
