'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Midia from './Midia';
import { FORMATOS, STATUS, formatarData, formatarHora } from '@/lib/formatos';
import {
  aprovar, pedirAjuste, comentarComoCliente,
  comentarComoPhilar, excluirPost, atualizarPost, voltarParaPendente,
} from '@/app/actions';
import { enviarArquivos } from '@/lib/upload-client';

export default function PostCard({ post, modo, token, realce }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [painel, setPainel] = useState(null); // 'ajuste' | 'versao' | null
  const [texto, setTexto] = useState('');
  const cliente = modo === 'cliente';

  const rodar = (fn) => iniciar(async () => { await fn(); router.refresh(); });

  function enviarComentario() {
    const t = texto.trim();
    if (!t) return;
    rodar(async () => {
      if (cliente) await comentarComoCliente(token, post.id, t);
      else await comentarComoPhilar(post.id, t);
      setTexto('');
    });
  }

  return (
    <article id={`post-${post.id}`} className={`post${realce ? ' realce' : ''}`}>
      <Midia midias={post.midias} formato={post.formato} />
      <div className="post-corpo">
        <div className="post-cab">
          <h3>{post.titulo}</h3>
          <span className={`selo ${post.status}`}>{STATUS[post.status]}</span>
        </div>
        <div className="post-meta">
          {FORMATOS[post.formato] || post.formato} · {formatarData(post.data_publicacao)}
        </div>
        {post.legenda && <p className="legenda">{post.legenda}</p>}

        {/* Ações do cliente */}
        {cliente && post.status !== 'aprovado' && painel !== 'ajuste' && (
          <div className="acoes">
            <button className="btn ok" disabled={pendente} onClick={() => rodar(() => aprovar(token, post.id))}>
              ✓ Aprovar
            </button>
            <button className="btn ajuste" disabled={pendente} onClick={() => setPainel('ajuste')}>
              Pedir ajuste
            </button>
          </div>
        )}
        {cliente && painel === 'ajuste' && (
          <div style={{ marginBottom: 12 }}>
            <label>O que você gostaria de ajustar?</label>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
            <div className="acoes" style={{ marginTop: 8 }}>
              <button
                className="btn ajuste" disabled={pendente || !texto.trim()}
                onClick={() => rodar(async () => {
                  await pedirAjuste(token, post.id, texto);
                  setTexto(''); setPainel(null);
                })}
              >
                Enviar pedido de ajuste
              </button>
              <button className="btn claro" onClick={() => setPainel(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Ações da Philar */}
        {!cliente && painel !== 'versao' && (
          <div className="acoes">
            <button className="btn claro mini" onClick={() => setPainel('versao')}>Enviar nova versão</button>
            {post.status !== 'pendente' && (
              <button className="btn claro mini" disabled={pendente} onClick={() => rodar(() => voltarParaPendente(post.id))}>
                Voltar para “aguardando”
              </button>
            )}
            <button
              className="btn perigo mini" disabled={pendente}
              onClick={() => window.confirm('Excluir este conteúdo?') && rodar(() => excluirPost(post.id))}
            >
              Excluir
            </button>
          </div>
        )}
        {!cliente && painel === 'versao' && (
          <NovaVersao post={post} aoFechar={() => { setPainel(null); router.refresh(); }} />
        )}

        <div className="comentarios">
          {post.comentarios.map((c) => (
            <div key={c.id} className={`comentario ${c.autor}`}>
              <b>{c.autor === 'philar' ? 'Philar' : cliente ? 'Você' : 'Cliente'}</b>
              <small>{formatarHora(c.criado_em)}</small>
              <p>{c.texto}</p>
            </div>
          ))}
          <div className="novo-coment">
            <textarea
              placeholder="Escreva um comentário…"
              value={painel === 'ajuste' ? '' : texto}
              disabled={painel === 'ajuste'}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button className="btn mini" disabled={pendente || painel === 'ajuste' || !texto.trim()} onClick={enviarComentario}>
              Enviar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function NovaVersao({ post, aoFechar }) {
  const [legenda, setLegenda] = useState(post.legenda || '');
  const [data, setData] = useState(post.data_publicacao || '');
  const [arquivos, setArquivos] = useState([]);
  const [status, setStatus] = useState('');
  const [erro, setErro] = useState('');

  async function salvar() {
    setErro('');
    try {
      let midias = [];
      if (arquivos.length) {
        midias = await enviarArquivos(post.cliente_id, arquivos, (n, t) => setStatus(`Enviando ${n} de ${t}…`));
      }
      setStatus('Salvando…');
      await atualizarPost(post.id, { legenda, data_publicacao: data, midias });
      aoFechar();
    } catch (e) {
      setErro(e.message || 'Algo deu errado.');
      setStatus('');
    }
  }

  return (
    <div className="caixa" style={{ marginBottom: 12, padding: 14 }}>
      <div className="campo">
        <label>Nova legenda</label>
        <textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} />
      </div>
      <div className="campo">
        <label>Data prevista</label>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>
      <div className="campo">
        <label>Novos arquivos (deixe vazio para manter os atuais)</label>
        <input type="file" multiple accept="image/*,video/*" onChange={(e) => setArquivos(Array.from(e.target.files || []))} />
      </div>
      {erro && <p className="erro">{erro}</p>}
      <div className="acoes">
        <button className="btn mini" disabled={!!status} onClick={salvar}>{status || 'Enviar para aprovação'}</button>
        <button className="btn claro mini" disabled={!!status} onClick={aoFechar}>Cancelar</button>
      </div>
    </div>
  );
}
