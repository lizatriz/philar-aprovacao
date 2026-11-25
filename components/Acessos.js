'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { salvarAcesso, excluirAcesso, revelarSenha } from '@/app/hub-actions';
import { formatarHora } from '@/lib/formatos';

const PLATAFORMAS = ['Instagram', 'TikTok', 'Facebook / Meta Business', 'YouTube', 'LinkedIn', 'Pinterest', 'Google / Gmail', 'Canva', 'Site / WordPress', 'Outro'];

export default function Acessos({ clienteId, acessos, souDona }) {
  const [editando, setEditando] = useState(null); // null | 'novo' | acesso
  return (
    <div>
      <div className="barra-salvar">
        <span className="sub" style={{ margin: 0 }}>
          🔒 Senhas criptografadas. Cada vez que alguém vê ou copia uma senha, fica registrado.
        </span>
        {!editando && <button className="btn" onClick={() => setEditando('novo')}>+ Novo acesso</button>}
      </div>

      {editando && (
        <FormAcesso
          clienteId={clienteId}
          acesso={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
        />
      )}

      {acessos.length === 0 && !editando ? (
        <p className="vazio">Nenhum acesso guardado para este cliente.</p>
      ) : (
        <div className="grade-acessos">
          {acessos.map((a) => (
            <CartaoAcesso key={a.id} acesso={a} souDona={souDona} aoEditar={() => setEditando(a)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Copiar({ texto, rotulo = 'Copiar' }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button" className="btn claro mini"
      onClick={async () => { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500); }}
    >
      {ok ? 'Copiado!' : rotulo}
    </button>
  );
}

function CartaoAcesso({ acesso, souDona, aoEditar }) {
  const router = useRouter();
  const [senha, setSenha] = useState(null);
  const [erro, setErro] = useState('');
  const [copiada, setCopiada] = useState(false);
  const [verHistorico, setVerHistorico] = useState(false);
  const [pendente, iniciar] = useTransition();

  // Esconde a senha de novo depois de 30 segundos
  useEffect(() => {
    if (!senha) return;
    const t = setTimeout(() => setSenha(null), 30000);
    return () => clearTimeout(t);
  }, [senha]);

  const mostrar = () => iniciar(async () => {
    setErro('');
    const r = await revelarSenha(acesso.id, 'viu');
    if (r.erro) setErro(r.erro); else { setSenha(r.senha); router.refresh(); }
  });

  const copiar = () => iniciar(async () => {
    setErro('');
    const r = await revelarSenha(acesso.id, 'copiou');
    if (r.erro) return setErro(r.erro);
    await navigator.clipboard.writeText(r.senha);
    setCopiada(true);
    setTimeout(() => setCopiada(false), 1500);
    router.refresh();
  });

  return (
    <div className="caixa acesso">
      <div className="post-cab">
        <h3>{acesso.plataforma}</h3>
        <div className="acoes" style={{ marginBottom: 0 }}>
          <button className="btn claro mini" onClick={aoEditar}>Editar</button>
        </div>
      </div>

      {acesso.usuario && (
        <div className="campo-acesso">
          <label>Usuário / e-mail</label>
          <div className="linha-acesso">
            <code>{acesso.usuario}</code>
            <Copiar texto={acesso.usuario} />
          </div>
        </div>
      )}

      <div className="campo-acesso">
        <label>Senha</label>
        <div className="linha-acesso">
          <code>{senha ?? '••••••••••'}</code>
          {senha
            ? <button className="btn claro mini" onClick={() => setSenha(null)}>Esconder</button>
            : <button className="btn claro mini" disabled={pendente} onClick={mostrar}>Mostrar</button>}
          <button className="btn mini" disabled={pendente} onClick={copiar}>{copiada ? 'Copiada!' : 'Copiar'}</button>
        </div>
        {erro && <p className="erro" style={{ margin: '6px 0 0' }}>{erro}</p>}
      </div>

      {acesso.link && (
        <div className="campo-acesso">
          <label>Link</label>
          <a href={acesso.link.startsWith('http') ? acesso.link : `https://${acesso.link}`} target="_blank" rel="noreferrer" className="link-acesso">
            {acesso.link}
          </a>
        </div>
      )}
      {acesso.observacoes && (
        <div className="campo-acesso">
          <label>Observações</label>
          <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>{acesso.observacoes}</p>
        </div>
      )}

      <div className="rodape-acesso">
        <span>Atualizado em {formatarHora(acesso.atualizado_em)}</span>
        {souDona && acesso.historico?.length > 0 && (
          <button className="link-botao" onClick={() => setVerHistorico(!verHistorico)}>
            {verHistorico ? 'Ocultar histórico' : 'Ver histórico'}
          </button>
        )}
      </div>
      {verHistorico && (
        <ul className="historico">
          {acesso.historico.map((h) => (
            <li key={h.id}><b>{h.membro?.nome?.split(' ')[0] || 'Alguém'}</b> {h.acao} · {formatarHora(h.criado_em)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormAcesso({ clienteId, acesso, aoFechar }) {
  const router = useRouter();
  const conhecida = !acesso || PLATAFORMAS.includes(acesso.plataforma);
  const [dados, setDados] = useState({
    plataforma: conhecida ? acesso?.plataforma || 'Instagram' : 'Outro',
    outro: conhecida ? '' : acesso.plataforma,
    usuario: acesso?.usuario || '',
    senha: '',
    link: acesso?.link || '',
    observacoes: acesso?.observacoes || '',
  });
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();
  const set = (k) => (e) => setDados({ ...dados, [k]: e.target.value });

  const salvar = (e) => {
    e.preventDefault();
    iniciar(async () => {
      const plataforma = dados.plataforma === 'Outro' ? dados.outro.trim() || 'Outro' : dados.plataforma;
      const r = await salvarAcesso(clienteId, { ...dados, plataforma, id: acesso?.id });
      if (r?.erro) return setErro(r.erro);
      aoFechar();
      router.refresh();
    });
  };

  return (
    <form onSubmit={salvar} className="caixa" style={{ marginBottom: 20, maxWidth: 560 }}>
      <h3 style={{ marginBottom: 16 }}>{acesso ? `Editar ${acesso.plataforma}` : 'Novo acesso'}</h3>
      <div className="linha2">
        <div className="campo">
          <label>Plataforma</label>
          <select value={dados.plataforma} onChange={set('plataforma')}>
            {PLATAFORMAS.map((p) => <option key={p}>{p}</option>)}
          </select>
          {dados.plataforma === 'Outro' && (
            <input value={dados.outro} onChange={set('outro')} placeholder="Nome (ex: Hotmart)" style={{ marginTop: 6 }} />
          )}
        </div>
        <div className="campo">
          <label>Usuário / e-mail</label>
          <input value={dados.usuario} onChange={set('usuario')} autoComplete="off" />
        </div>
      </div>
      <div className="campo">
        <label>{acesso ? 'Nova senha (deixe vazio para manter a atual)' : 'Senha'}</label>
        <input value={dados.senha} onChange={set('senha')} type="password" autoComplete="new-password" required={!acesso} />
      </div>
      <div className="campo">
        <label>Link de login (opcional)</label>
        <input value={dados.link} onChange={set('link')} placeholder="business.facebook.com" />
      </div>
      <div className="campo">
        <label>Observações (opcional, não coloque senhas aqui)</label>
        <textarea value={dados.observacoes} onChange={set('observacoes')} rows={2} placeholder="Ex: código de verificação vai para o celular do cliente." />
      </div>
      {erro && <p className="erro">{erro}</p>}
      <div className="acoes" style={{ marginBottom: 0 }}>
        <button className="btn" disabled={pendente}>{pendente ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="btn claro" onClick={aoFechar}>Cancelar</button>
        {acesso && (
          <button
            type="button" className="btn perigo" disabled={pendente} style={{ marginLeft: 'auto' }}
            onClick={() => window.confirm(`Excluir o acesso ${acesso.plataforma}?`) &&
              iniciar(async () => { await excluirAcesso(acesso.id); aoFechar(); router.refresh(); })}
          >
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
