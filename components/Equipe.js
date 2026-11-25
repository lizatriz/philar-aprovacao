'use client';

import { useActionState, useRef, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adicionarMembro, redefinirSenha, removerMembro, alterarPapel } from '@/app/equipe-actions';

// Sugere uma senha provisória fácil de ditar (ex: "philar-4821-mesa")
function senhaSugerida() {
  const palavras = ['sol', 'mar', 'lua', 'flor', 'cafe', 'post', 'reels', 'story', 'luz', 'mesa'];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `philar-${n}-${palavras[Math.floor(Math.random() * palavras.length)]}`;
}

export function FormNovoMembro() {
  const form = useRef(null);
  const [estado, acao, enviando] = useActionState(adicionarMembro, null);
  const [senha, setSenha] = useState('');
  useEffect(() => { setSenha(senhaSugerida()); }, []);
  useEffect(() => {
    if (estado?.ok) { form.current?.reset(); setSenha(senhaSugerida()); }
  }, [estado]);

  return (
    <form ref={form} action={acao} className="caixa">
      <h3 style={{ marginBottom: 16 }}>Adicionar pessoa</h3>
      <div className="campo">
        <label htmlFor="nome">Nome</label>
        <input id="nome" name="nome" required />
      </div>
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha provisória</label>
        <input id="senha" name="senha" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} required />
        <p className="sub" style={{ fontSize: 12, marginTop: 6 }}>
          A pessoa entra com essa senha e o site pede para ela criar uma nova.
        </p>
      </div>
      {estado?.erro && <p className="erro">{estado.erro}</p>}
      {estado?.ok && <p className="sucesso">{estado.ok}</p>}
      <button className="btn" disabled={enviando} style={{ width: '100%', justifyContent: 'center' }}>
        {enviando ? 'Adicionando…' : 'Adicionar à equipe'}
      </button>
    </form>
  );
}

export function LinhaMembro({ membro, souEu }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState(null);

  function novaSenha() {
    const sugestao = senhaSugerida();
    const senha = window.prompt(`Nova senha provisória para ${membro.nome}:`, sugestao);
    if (!senha) return;
    iniciar(async () => {
      const r = await redefinirSenha(membro.user_id, senha);
      setMsg(r?.erro ? { erro: r.erro } : { ok: `Senha provisória: ${senha}` });
      router.refresh();
    });
  }

  return (
    <div className="membro">
      <div className="membro-info">
        <div className="avatar">{membro.nome.trim()[0]?.toUpperCase()}</div>
        <div>
          <b>{membro.nome}{souEu && ' (você)'}</b>
          <div className="sub" style={{ margin: 0, fontSize: 13 }}>{membro.email}</div>
          {membro.trocar_senha && <span className="selo pendente" style={{ marginTop: 4 }}>Ainda não criou a senha</span>}
          {msg?.ok && <p className="sucesso" style={{ margin: '4px 0 0' }}>{msg.ok}</p>}
          {msg?.erro && <p className="erro" style={{ margin: '4px 0 0' }}>{msg.erro}</p>}
        </div>
      </div>
      <div className="acoes" style={{ marginBottom: 0 }}>
        {souEu ? (
          <span className="selo aprovado">Dona</span>
        ) : (
          <>
            <select
              value={membro.papel}
              disabled={pendente}
              onChange={(e) => iniciar(async () => { await alterarPapel(membro.user_id, e.target.value); router.refresh(); })}
              style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
            >
              <option value="equipe">Equipe</option>
              <option value="dona">Dona</option>
            </select>
            <button className="btn claro mini" disabled={pendente} onClick={novaSenha}>Nova senha</button>
            <button
              className="btn perigo mini" disabled={pendente}
              onClick={() => window.confirm(`Remover ${membro.nome} da equipe? Ela perde o acesso na hora.`) &&
                iniciar(async () => { await removerMembro(membro.user_id); router.refresh(); })}
            >
              Remover
            </button>
          </>
        )}
      </div>
    </div>
  );
}
